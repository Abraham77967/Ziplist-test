# ZipList Custom User-Mode PowerShell TCP Web Server
$port = 8080
$localIP = [System.Net.IPAddress]::Any
$server = New-Object System.Net.Sockets.TcpListener($localIP, $port)
$server.Start()
Write-Host "Server started successfully!"
Write-Host "Local: http://localhost:$port/"
Write-Host "Phone Access URL: http://10.0.0.156:$port/"
Write-Host "Press Ctrl+C to terminate this server."

try {
    while ($true) {
        $client = $server.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $reader = New-Object System.IO.StreamReader($stream)
            
            # Read HTTP request header
            $requestLine = $reader.ReadLine()
            if ($null -eq $requestLine) {
                continue
            }
            
            # Format check: GET /index.html HTTP/1.1
            $parts = $requestLine -split ' '
            if ($parts.Length -lt 2) {
                continue
            }
            
            $urlPath = $parts[1]
            
            # Strip query parameters if present (like ?list=...)
            if ($urlPath.Contains("?")) {
                $urlPath = $urlPath.Substring(0, $urlPath.IndexOf("?"))
            }
            
            if ($urlPath -eq "/") { 
                $urlPath = "/index.html" 
            }
            
            # Resolve full path
            $filePath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $urlPath))
            $currentDir = [System.IO.Path]::GetFullPath((Get-Location))
            
            # Verify file is within project folder (prevent directory traversal)
            if (-not $filePath.StartsWith($currentDir)) {
                $err = "HTTP/1.1 403 Forbidden`r`nContent-Length: 9`r`nConnection: close`r`n`r`nForbidden"
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes($err)
                $stream.Write($errBytes, 0, $errBytes.Length)
                continue
            }
            
            if (Test-Path $filePath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                
                # Map Content-Type
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = "text/plain"
                if ($ext -eq ".html") { $contentType = "text/html; charset=utf-8" }
                elseif ($ext -eq ".css") { $contentType = "text/css; charset=utf-8" }
                elseif ($ext -eq ".js") { $contentType = "application/javascript; charset=utf-8" }
                elseif ($ext -eq ".json") { $contentType = "application/json; charset=utf-8" }
                elseif ($ext -eq ".ico") { $contentType = "image/x-icon" }
                
                $header = "HTTP/1.1 200 OK`r`n" +
                          "Content-Type: $contentType`r`n" +
                          "Content-Length: $($bytes.Length)`r`n" +
                          "Access-Control-Allow-Origin: *`r`n" +
                          "Connection: close`r`n`r`n"
                
                $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                $stream.Write($bytes, 0, $bytes.Length)
            } else {
                $err = "HTTP/1.1 404 Not Found`r`nContent-Length: 14`r`nConnection: close`r`n`r`nFile Not Found"
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes($err)
                $stream.Write($errBytes, 0, $errBytes.Length)
            }
        } catch {
            Write-Host "Error serving request: $_"
        } finally {
            if ($client) {
                $client.Close()
            }
        }
    }
} catch {
    Write-Host "Server listener interrupted: $_"
} finally {
    $server.Stop()
    Write-Host "Server stopped."
}
