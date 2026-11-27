# RELRO Security — Jekyll site

```
bundle install
bundle exec jekyll serve      # http://localhost:4000
bundle exec jekyll build      # output in _site/
```

## Where things live

| What | File |
|---|---|
| Site name, tagline, email, nav links | `_config.yml` |
| Chain-of-trust scroll story (cards + 3D camera/highlights) | `_data/scenes.yml` |
| Capability matrix | `_data/capabilities.yml`, `_data/industries.yml` |
| "Ways to work with us" | `_data/services.yml` |
| "Done before" | `_data/work.yml` |
| "How we work" | `_data/how.yml` |
| Page structure | `index.html`, `_layouts/default.html`, `_includes/` |
| Styles | `assets/css/main.css` |
| 3D board + interactions | `assets/js/main.js` |

Scenes are rendered to HTML by Liquid and also passed to the 3D script as JSON
(`<script id="scene-data">`), so editing `scenes.yml` updates both.
