# tools.eliana.lol

Jekyll site for small single-purpose tools, hosted on GitHub Pages.

## Add a tool

1. Copy `_templates/tool.md` to `_tools/<name>.md`. The filename becomes the URL: `/<name>`.
2. Set `title`, `description` and `category` in the front matter. The category must match a name in `_data/categories.yml`.
3. Write the tool's HTML, `<style>` and `<script>` in the body. The layout adds the head, nav, theme toggle and footer.
4. Push. The homepage index and sitemap are generated on build.

Liquid is turned off for `_tools/`, so `{{ }}` and `{% %}` in your JS or templates are left alone.

## Add a category

Add a `name` and `emoji` to `_data/categories.yml`. Order in that file is the homepage order.

## Old tools

Tools not yet converted are plain `.html` files in the repo root, listed in `_data/legacy.yml`. To convert one, move its body into `_tools/<name>.md`, delete the `.html` file, and delete its entry from `legacy.yml`.

## Preview locally

```bash
bundle install
bundle exec jekyll serve
```
