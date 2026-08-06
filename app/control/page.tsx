'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';

interface Song {
  id: string;
  title?: string;
  artist?: string;
  author?: string;
  image_url?: string;
  audio_url?: string;
  created_at?: string;
  status?: string;
  prompt?: string;
  lyrics?: string;
}

type CatalogFilter = 'all' | 'ready' | 'processing' | 'lyrics';

const filters: Array<{ value: CatalogFilter; label: string }> = [
  { value: 'all', label: 'Todo' },
  { value: 'ready', label: 'Listo' },
  { value: 'processing', label: 'Procesando' },
  { value: 'lyrics', label: 'Con letra' },
];

const pendingStatuses = new Set(['queued', 'submitted', 'processing']);

function isReady(song: Song) {
  return Boolean(song.audio_url) && !pendingStatuses.has(song.status?.toLowerCase() || '');
}

function metadataScore(song: Song) {
  const fields = [song.title, song.artist, song.prompt, song.lyrics, song.audio_url];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('es', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
}

export default function ControlPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [secretInput, setSecretInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CatalogFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/control/verify')
      .then((response) => response.json())
      .then((data) => setIsAuthenticated(data.authenticated === true))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsCheckingAuth(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    setIsLoading(true);
    setCatalogError('');

    const loadCatalog = async () => {
      const collected: Song[] = [];
      let page = 1;

      while (page <= 10) {
        const response = await fetch(`/api/songs?per_page=100&page=${page}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (response.status === 401) {
          setIsAuthenticated(false);
          throw new Error('La sesion del estudio expiro');
        }
        if (!response.ok) {
          throw new Error(data.error || 'No se pudo cargar el catalogo');
        }
        const items: Song[] = Array.isArray(data) ? data : data.items || [];
        collected.push(...items);
        if (!data.has_more || !data.next_page) break;
        page = data.next_page;
      }

      return collected;
    };

    loadCatalog()
      .then((items) => {
        setSongs(items);
        setSelectedId((current) => current || items[0]?.id || null);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          setCatalogError(error.message);
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [isAuthenticated]);

  const filteredSongs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return songs.filter((song) => {
      const matchesQuery =
        !normalizedQuery ||
        [song.title, song.artist, song.prompt]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesFilter =
        filter === 'all' ||
        (filter === 'ready' && isReady(song)) ||
        (filter === 'processing' && !isReady(song)) ||
        (filter === 'lyrics' && Boolean(song.lyrics));
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, songs]);

  const selectedSong = songs.find((song) => song.id === selectedId) || null;
  const readyCount = songs.filter(isReady).length;
  const lyricsCount = songs.filter((song) => Boolean(song.lyrics)).length;
  const averageScore = songs.length
    ? Math.round(songs.reduce((total, song) => total + metadataScore(song), 0) / songs.length)
    : 0;

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError('');
    try {
      const response = await fetch('/api/control/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secretInput }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        return;
      }
      setAuthError(
        response.status === 503
          ? 'El panel no esta configurado.'
          : 'Clave incorrecta. Intenta de nuevo.'
      );
    } catch {
      setAuthError('No fue posible contactar el servicio de autenticacion.');
    } finally {
      setSecretInput('');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/control/verify', { method: 'DELETE' });
    } finally {
      setIsAuthenticated(false);
      setSongs([]);
    }
  };

  const copyMetadata = async () => {
    if (!selectedSong) return;
    const text = [
      selectedSong.title || 'Sin titulo',
      `Artista: ${selectedSong.artist || 'Iyari Gomez'}`,
      `Autor: ${selectedSong.author || 'Iyari Cancino Gomez'}`,
      selectedSong.prompt ? `Concepto: ${selectedSong.prompt}` : '',
      selectedSong.lyrics ? `\n${selectedSong.lyrics}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const exportMetadata = () => {
    if (!selectedSong) return;
    const blob = new Blob([JSON.stringify(selectedSong, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${selectedSong.title || selectedSong.id}-metadata.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (isCheckingAuth) {
    return (
      <main className="studio-shell flex min-h-screen items-center justify-center" aria-busy="true">
        <div className="studio-loader" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="studio-shell flex min-h-screen items-center justify-center p-5 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="studio-orb studio-orb-one" />
          <div className="studio-orb studio-orb-two" />
        </div>
        <section className="studio-panel relative w-full max-w-md overflow-hidden rounded-[2rem] p-8 sm:p-10">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="brand-mark">S</div>
              <div>
                <p className="text-sm font-semibold tracking-[0.22em] text-white">SUNOPO</p>
                <p className="text-xs text-zinc-500">Creator operations</p>
              </div>
            </div>
            <span className="studio-pill">PRIVATE</span>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-amber-300">
              Acceso al estudio
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em]">
              Tu catalogo.
              <br />
              Bajo control.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
              Gestiona metadata, calidad y distribucion desde un solo espacio creativo.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <label
              htmlFor="studio-secret"
              className="block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500"
            >
              Clave del estudio
            </label>
            <input
              id="studio-secret"
              type="password"
              value={secretInput}
              onChange={(event) => setSecretInput(event.target.value)}
              placeholder="Introduce tu clave"
              className="studio-input w-full rounded-2xl px-5 py-4 text-sm outline-none"
              autoFocus
              required
            />
            {authError && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {authError}
              </p>
            )}
            <button
              type="submit"
              className="studio-primary w-full rounded-2xl px-5 py-4 text-sm font-semibold"
            >
              Entrar al estudio
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="studio-shell min-h-screen text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] px-5 py-7 xl:flex xl:flex-col">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="brand-mark">S</div>
            <div>
              <p className="text-sm font-semibold tracking-[0.22em]">SUNOPO</p>
              <p className="text-[11px] text-zinc-600">Studio OS</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button className="studio-nav studio-nav-active w-full" aria-current="page">
              Catalogo
            </button>
            <Link href="/display" className="studio-nav block">
              Crear musica
            </Link>
            <button className="studio-nav w-full">Distribucion</button>
            <button className="studio-nav w-full">Analitica</button>
          </nav>

          <div className="mt-auto space-y-4">
            <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-4">
              <p className="text-xs font-semibold text-amber-200">Suno conectado</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Sesion protegida y lista para sincronizar.
              </p>
            </div>
            <button onClick={handleLogout} className="studio-nav w-full">
              Cerrar sesion
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex flex-col gap-5 border-b border-white/[0.06] px-5 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-600">
                Creator workspace
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
                Catalogo maestro
              </h1>
            </div>
            <div className="flex flex-1 items-center gap-3 lg:max-w-2xl lg:justify-end">
              <label className="studio-search flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-4 py-3 lg:max-w-md">
                <span className="text-zinc-600">/</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar titulo, artista o concepto"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
                />
              </label>
              <Link href="/display" className="studio-primary whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-semibold">
                + Nueva obra
              </Link>
            </div>
          </header>

          <div className="grid gap-5 p-5 lg:p-8 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-5">
              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  ['Obras', songs.length, 'Catalogo total'],
                  ['Listas', readyCount, 'Audio terminado'],
                  ['Con letra', lyricsCount, 'Listas para metadata'],
                  ['Calidad', `${averageScore}%`, 'Completitud media'],
                ].map(([label, value, caption]) => (
                  <article key={label} className="studio-card rounded-2xl p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
                      {label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
                    <p className="mt-1 text-xs text-zinc-500">{caption}</p>
                  </article>
                ))}
              </section>

              <section className="studio-panel overflow-hidden rounded-3xl">
                <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold">Biblioteca creativa</h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      {filteredSongs.length} obras en esta vista
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setFilter(item.value)}
                        aria-pressed={filter === item.value}
                        className={`rounded-full px-3 py-1.5 text-xs transition ${
                          filter === item.value
                            ? 'bg-white text-black'
                            : 'bg-white/[0.04] text-zinc-500 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {catalogError && (
                  <div className="m-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm text-amber-200">
                    {catalogError}. Verifica tu sesion de Suno y vuelve a cargar.
                  </div>
                )}

                <div className="overflow-x-auto">
                  <div className="min-w-[720px]">
                    <div className="grid grid-cols-[minmax(260px,1.5fr)_140px_110px_120px] gap-4 border-b border-white/[0.05] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                      <span>Obra</span>
                      <span>Estado</span>
                      <span>Metadata</span>
                      <span>Creada</span>
                    </div>
                    {isLoading ? (
                      <div className="space-y-2 p-4">
                        {[1, 2, 3, 4, 5].map((item) => (
                          <div key={item} className="h-16 animate-pulse rounded-xl bg-white/[0.03]" />
                        ))}
                      </div>
                    ) : filteredSongs.length ? (
                      filteredSongs.map((song, index) => {
                        const score = metadataScore(song);
                        const active = selectedSong?.id === song.id;
                        return (
                          <button
                            key={song.id}
                            onClick={() => setSelectedId(song.id)}
                            className={`grid w-full grid-cols-[minmax(260px,1.5fr)_140px_110px_120px] items-center gap-4 border-b border-white/[0.04] px-5 py-3 text-left transition ${
                              active ? 'bg-amber-300/[0.06]' : 'hover:bg-white/[0.025]'
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className={`cover-gradient cover-gradient-${(index % 4) + 1}`}>
                                {(song.title || 'S').charAt(0).toUpperCase()}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium">
                                  {song.title || 'Obra sin titulo'}
                                </span>
                                <span className="mt-1 block truncate text-xs text-zinc-600">
                                  {song.artist || 'Iyari Gomez'}
                                </span>
                              </span>
                            </span>
                            <span>
                              <span
                                className={`status-dot ${isReady(song) ? 'status-ready' : 'status-processing'}`}
                              />
                              <span className="text-xs text-zinc-400">
                                {isReady(song) ? 'Lista' : 'Procesando'}
                              </span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="h-1.5 w-12 overflow-hidden rounded-full bg-white/[0.06]">
                                <span
                                  className="block h-full rounded-full bg-amber-300"
                                  style={{ width: `${score}%` }}
                                />
                              </span>
                              <span className="text-xs text-zinc-500">{score}%</span>
                            </span>
                            <span className="text-xs text-zinc-500">{formatDate(song.created_at)}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-5 py-16 text-center">
                        <p className="text-sm text-zinc-400">No hay obras en esta vista.</p>
                        <p className="mt-1 text-xs text-zinc-600">
                          Ajusta los filtros o crea una nueva pieza.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <aside className="studio-panel h-fit overflow-hidden rounded-3xl 2xl:sticky 2xl:top-8">
              {selectedSong ? (
                <>
                  <div className="inspector-cover relative flex h-44 items-end p-6">
                    <div>
                      <span className="studio-pill">SELECTED WORK</span>
                      <h2 className="mt-3 max-w-xs text-2xl font-semibold tracking-[-0.04em]">
                        {selectedSong.title || 'Obra sin titulo'}
                      </h2>
                    </div>
                  </div>
                  <div className="space-y-6 p-6">
                    {selectedSong.audio_url && (
                      <audio controls src={selectedSong.audio_url} className="h-10 w-full" />
                    )}

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Preparacion
                        </p>
                        <span className="text-xs font-semibold text-amber-200">
                          {metadataScore(selectedSong)}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-300"
                          style={{ width: `${metadataScore(selectedSong)}%` }}
                        />
                      </div>
                    </div>

                    <dl className="space-y-4">
                      {[
                        ['Artista', selectedSong.artist || 'Iyari Gomez'],
                        ['Autor', selectedSong.author || 'Iyari Cancino Gomez'],
                        ['Estado', isReady(selectedSong) ? 'Master listo' : 'En produccion'],
                        ['Distribucion', 'Pendiente'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-4">
                          <dt className="text-xs text-zinc-600">{label}</dt>
                          <dd className="text-right text-xs font-medium text-zinc-300">{value}</dd>
                        </div>
                      ))}
                    </dl>

                    {selectedSong.prompt && (
                      <div className="rounded-2xl bg-black/30 p-4">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                          Concepto
                        </p>
                        <p className="line-clamp-4 text-xs leading-5 text-zinc-400">
                          {selectedSong.prompt}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={copyMetadata} className="studio-secondary rounded-xl px-3 py-3 text-xs font-medium">
                        {copied ? 'Copiado' : 'Copiar metadata'}
                      </button>
                      <button onClick={exportMetadata} className="studio-secondary rounded-xl px-3 py-3 text-xs font-medium">
                        Exportar JSON
                      </button>
                    </div>
                    <a
                      href="https://soundcloud.com/upload"
                      target="_blank"
                      rel="noreferrer"
                      className="studio-primary block rounded-xl px-4 py-3 text-center text-xs font-semibold"
                    >
                      Preparar para SoundCloud
                    </a>
                  </div>
                </>
              ) : (
                <div className="p-10 text-center text-sm text-zinc-600">
                  Selecciona una obra para revisar sus metadatos.
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
