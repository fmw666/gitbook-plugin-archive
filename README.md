# gitbook-plugin-archive

> A GitBook plugin to archive articles by date and tags.

## Installation

Install via `yarn` or `npm`:

```bash
# Yarn
yarn add github:fmw666/gitbook-plugin-archive

# NPM
npm install --save fmw666/gitbook-plugin-archive
```

Add to plugins in `book.json`:

```json
...
  "plugins": [
    ...
    "archive"
    ...
  ]
...
```

## Usage

+ in article

  ```md
  ---
  title: "title"
  author: "author"
  date: 2023-08-26 01:16:00
  tags: ["读书", "笔记"]
  ---

  content
  ```

+ `dateinfo` by blocks

  ```h
  {% dateinfo %}{% enddateinfo %}
  ```

  *Example output*

  ```html
  <h6>2023-08-26</h6>

  <ul>
    <li><a href="http://example.com">My first article</a></li>
    <li><a href="http://example.com">My second article</a></li>
  </ul>

  <h6>2023-08-25</h6>

  <ul>
    <li><a href="http://example.com">My third article</a></li>
  </ul>
  ```

+ `tagsinfo` by blocks

  ```h
  {% tagsinfo %}{% endtagsinfo %}
  ```

  *Example output*

  ```html
  <div id="tags" class="tags">
    <p>
      <i class="fa fa-tags" aria-hidden="true"></i>
      <a href="#读书">读书</a>
      <a href="#笔记">笔记</a>
    </p>
  </div>

  <h6>读书</h6>

  <ul>
    <li><a href="http://example.com">path1 > path2 > My first article</a></li>
    <li><a href="http://example.com">path1 > My second article</a></li>
  </ul>

  <h6>笔记</h6>

  <ul>
    <li><a href="http://example.com">My third article</a></li>
  </ul>
  ```

### config placement

Tags will show after the title by default, you can config the placement in the bottom.

```
    "pluginsConfig": {
        "archive": {
            "placement": "bottom"
        }
    }
```

## Options

### `limit` (default: `all`)

Controls maximum number of articles to display, eg show only the last 5 updated
articles:

```
{% recentlyupdated limit="5" %}{% endrecentlyupdated %}
```

## Example output

###### Tue Dec 05 2017

- [Chapter 3 > My most recently updated article](http://example.com)
- [Chapter 1 > My second-most recently updated article](http://example.com)

###### Fri Dec 01 2017

- [Chapter 2 > An article I modified last week](http://example.com)
