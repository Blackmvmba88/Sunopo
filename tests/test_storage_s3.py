import io
from unittest.mock import Mock, patch

from storage.s3 import S3Storage


def test_s3_save_and_exists(monkeypatch):
    mock_client = Mock()

    # patch boto3 client creation inside module
    with patch("storage.s3.boto3.client") as boto_client:
        boto_client.return_value = mock_client
        s3 = S3Storage("my-bucket", "us-east-1")

        # test save
        fake_file = io.BytesIO(b"data")
        mock_client.upload_fileobj.return_value = None
        res = s3.save("key.bin", fake_file)
        assert res == "s3://my-bucket/key.bin"

        # test exists (head_object returns ok)
        mock_client.head_object.return_value = {}
        assert s3.exists("key.bin") is True

        # test exists when head_object raises
        mock_client.head_object.side_effect = Exception()
        assert s3.exists("nope") is False
