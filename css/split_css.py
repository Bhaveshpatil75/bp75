import re
import os

os.chdir(r"c:\Users\bhave\bp75\css")

with open("style.css", "r", encoding="utf-8") as f:
    text = f.read()

# We will extract sections by string splitting or regex to ensure exact braces match.

def extract_between(source, start_marker, end_marker=None):
    if start_marker not in source:
        return "", source
    start_idx = source.find(start_marker)
    if end_marker:
        end_idx = source.find(end_marker, start_idx)
        if end_idx == -1: end_idx = len(source)
    else:
        end_idx = len(source)
    
    extracted = source[start_idx:end_idx]
    remainder = source[:start_idx] + source[end_idx:]
    return extracted.strip() + "\n\n", remainder

# 1. Global: Everything up to Cinematic Navigation
global_text, text = extract_between(text, "/* Color System & Variables */", "/* Cinematic Navigation */")

# 2. Components: Nav
nav_text, text = extract_between(text, "/* Cinematic Navigation */", "body {")

# 3. Global: body / polygon / vignette
body_poly_text, text = extract_between(text, "body {", "/* --- Unified Button System --- */")
global_text += body_poly_text

# 4. Components: Buttons
btn_text, text = extract_between(text, "/* --- Unified Button System --- */", "/* Hero Section */")
components_text = nav_text + btn_text

# 5. Sections: Hero
hero_text, text = extract_between(text, "/* Hero Section */", "/* Projects Section */")

# Remove old Projects Section (Lines 256-259)
_, text = extract_between(text, "/* Projects Section */", "/* Interactive Skills Bubbles */")

# 6. Sections: Bubbles & Projects Preview
preview_text, text = extract_between(text, "/* Interactive Skills Bubbles */", ".project-list {")

# Remove hardcoded selected works and about
_, text = extract_between(text, ".project-list {", "/* Experience Timeline */")

# 7. Sections: Timeline & Achievements
timeline_text, text = extract_between(text, "/* Experience Timeline */", "/* Skills Section */")

# Remove Skills and Contact
_, text = extract_between(text, "/* Skills Section */", "/* --- Project Detail Modal --- */")

# 8. Components: Modals
modal_text, text = extract_between(text, "/* --- Project Detail Modal --- */", "/* --- Responsive Layout --- */")
components_text += modal_text

# 9. Sections Assembly
sections_text = hero_text + preview_text + timeline_text

# 10. Global: Responsive Layout
resp_text, text = extract_between(text, "/* --- Responsive Layout --- */")

# Clean up removed selectors from responsive layout
removals = [
    r"body \.about-section,\s*body \.skills-section,\s*body \.projects-section\s*\{[^}]*\}",
    r"body \.contact-section\s*\{[^}]*\}",
    r"body \.project-panel\s*\{[^}]*\}",
    r"body \.about-text\s*\{[^}]*\}",
    r"body \.skill-heading\s*\{[^}]*\}",
    r"body \.contact-link\s*\{[^}]*\}"
]

for pattern in removals:
    resp_text = re.sub(pattern, "", resp_text, flags=re.MULTILINE | re.DOTALL)

# Re-cleanup `.about-section, .skills-section, .projects-section` block
resp_text = re.sub(r"body \.about-section,\s*body \.skills-section,\s*body \.projects-section\s*\{\s*padding:\s*[^\}]+\}", "", resp_text, flags=re.MULTILINE | re.DOTALL)

global_text += resp_text

# Save outputs
with open("global.css", "w", encoding="utf-8") as f: f.write(global_text)
with open("components.css", "w", encoding="utf-8") as f: f.write(components_text)
with open("sections.css", "w", encoding="utf-8") as f: f.write(sections_text)

# Rewrite style.css
with open("style.css", "w", encoding="utf-8") as f:
    f.write("@import url('global.css');\n")
    f.write("@import url('components.css');\n")
    f.write("@import url('sections.css');\n")

print("SPLIT COMPLETE")
