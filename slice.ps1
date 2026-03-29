$lines = Get-Content -Encoding UTF8 .\index.html
$newLines = $lines[0..493]
$newLines | Set-Content -Encoding UTF8 .\index.html
Add-Content -Encoding UTF8 .\index.html "    </div>"
Add-Content -Encoding UTF8 .\index.html "    <script src=`"script.js`"></script>"
Add-Content -Encoding UTF8 .\index.html "</body>"
Add-Content -Encoding UTF8 .\index.html "</html>"
