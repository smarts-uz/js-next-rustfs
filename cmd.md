Invoke-WebRequest -Uri "https://dl.min.io/aistor/mc/release/windows-amd64/mc.exe" -OutFile "mc.exe"

mc alias set myminio http://localhost:9000 minioadmin minioadmin123

mc anonymous set download myminio/uploads

.\mc alias set rustfs http://192.168.3.151:30100 rustfsadmin rustfsadmin

.\mc anonymous set download rustfs/uploads