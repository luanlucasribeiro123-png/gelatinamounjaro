with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = lines[:494]
new_lines.extend(["    </div>\n", "    <script src=\"script.js\"></script>\n", "</body>\n", "</html>\n"])

with open("index.html", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
