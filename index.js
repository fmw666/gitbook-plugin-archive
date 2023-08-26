var slug = require('github-slugid');
var eol = require('os').EOL;
const fs = require('fs');
const path = require('path');

const projRootPath = path.join(__dirname, '../', '../', 'docs');
let jsonData = {};

module.exports = {
  book: {
    assets: './assets',
    css: [
      "plugin.css"
    ]
  },
  hooks: {
    // 读取文件内容，生成 data.json 文件
    /*
      data.json = {
        "README.md": {
          "title": "本文介绍",
          "path": "README.md",
          "date": "2023-08-26 01:16:00",
          "tags": [
            "标签1",
            "标签2",
            "..."
          ]
        }
      }
    */
    init: function() {
      this.summary.walk(function(article) {
        // 遍历文章，读取文章内容
        var articlefilePath = path.join(projRootPath, article.path);
        var articleContent = fs.readFileSync(articlefilePath, 'utf8');
        // yaml 格式的文章，从中提取 date 和 tags. 默认为 '' 和 []
        var dateMatch = articleContent.match(/^\s*date:\s*\[*(.*?)\]*$/im);
        var date = '';
        if (dateMatch) {
          var date = dateMatch[1];
        }
        var tagsMatch = articleContent.match(/tags:\s*\[*(.*?)\]*$/im);
        var tags = [];
        if (tagsMatch) {
          var rawtags = tagsMatch[1].split(',');
          rawtags.forEach(function(e) {
            var tags_ = e.match(/^\s*['"]*\s*(.*?)\s*['"]*\s*$/)[1];
            if (tags_) tags.push(tags_);
          })
        }
        // 构建 article 对象
        var articleInfo = {
          title: article.title,
          path: article.path,
          date: date,
          tags: tags
        };
        jsonData[article.path] = articleInfo;
      });
    },

    // 为每篇文章添加 tags
    "page:before": function(page) {
      if (this.output.name != 'website') return page;
      if (page.path.toLowerCase() === 'glossary.md') return page;

      // 从 jsonData 读取 tags 和 date. 默认值为 [] 和 ''
      var tags = jsonData[page.path].tags;
      var date = jsonData[page.path].date;

      // generate tags before html
      var tags_before_ = [];
      tags.forEach(function(e) {
        if (page.type === 'markdown') {
          tags_before_.push('[' + e + ']' + '(' + '/tags.html#' + slug(e) + ')');
        } else {
          tags_before_.push('link:/tags.html#' + slug(e) + '[' + e + ']');
        }
      })

      var tags_before = '';
      var date_before = '';
      if (page.type === 'markdown') {
        // 如果 tags 不为空，则添加 tags 信息
        if (tags_before_.length > 0) {
          tags_before = eol + '<i class="fa fa-tags" aria-hidden="true"></i>' + tags_before_.join(' ') + eol;
        }
        // 如果 date 不为空，则添加 date 信息
        if (date !== '') {
          date_before = eol + '<span><i class="fa fa-calendar" aria-hidden="true"></i>' + date + '</span>' + eol;
        }
      } else {
        // 如果 tags 不为空，则添加 tags 信息
        if (tags_before_.length > 0) {
          tags_before = eol + '*ADOCTAGS*' + tags_before_.join(' ') + eol;
        }
        // 如果 date 不为空，则添加 date 信息
        if (date !== '') {
          date_before = eol + '<span>*ADOCDATE*' + date + '</span>' + eol;
        }
      }

      // override raw tags in page
      page.content = page.content.replace(/^\s?tags:\s?\[?(.*?)\]?$/im, eol);
      // replace tags info from page and YAML
      var tags_format = eol.concat(eol, 'tagsstart', eol, tags_before, date_before, eol, 'tagsstop', eol);

      // 展示位置判断
      var placement = this.config.get('pluginsConfig.archive.placement') || 'top';
      if (placement === 'bottom') {
        page.content = page.content.concat(tags_format);
      } else {
        if (page.type === 'markdown') {
          page.content = page.content.replace(/^#\s*(.*?)$/m, '#$1' + tags_format);
        } else {
          page.content = page.content.replace(/^=\s*(.*?)$/m, '=$1' + tags_format);
        }
      }
      return page;
    },

    "page": function(page) {
      // add tags id and class
      page.content = page.content.replace(/(<div class="paragraph">)?\s*<p>tagsstart<\/p>\s*(<\/div>)?/, '<!-- tags --><div id="tags" class="tags">');
      page.content = page.content.replace(/(<div class="paragraph">)?\s*<p>tagsstop<\/p>\s*(<\/div>)?/, '</div><!-- tagsstop -->');
      page.content = page.content.replace('<strong>ADOCTAGS</strong>', '<i class="fa fa-tags" aria-hidden="true"></i> ');
      page.content = page.content.replace('<strong>ADOCDATE</strong>', '<i class="fa fa-calendar" aria-hidden="true"></i> ');
      return page;
    },
  },
 blocks: {
    // 渲染 dateinfo 内容
    dateinfo: {
      process(block) {
        // 构建数据结构
        /*
          dateDict = {
            "2023-08-26": [
              {
                "title": "牧羊少年奇幻之旅.md",
                "path": "path/to/牧羊少年奇幻之旅.md",
                "date": "2023-08-26T01:16:00.000Z",
                "tags": ["读书", "笔记"]
              },
            ],
            "2023-08-20": [
              {
                "title": "1.关于作者.md",
                "path": "path/to/1.关于作者.md",
                "date": "2023-08-20T10:00:00.000Z",
                "tags": ["读书", "笔记"]
              }
            ]
          }
        */
        // 首先遍历 jsonData，如果 date 属性有值（有可能为空），则转为 Date 对象，插入到 dateDict 中
        var dateDict = {};
        Object.keys(jsonData).forEach(key => {
          var item = jsonData[key];
          if (item.date) {
            var date = new Date(item.date);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            var dateStr = `${year}-${month}-${day}`;
            dateDict[dateStr] = dateDict[dateStr] || [];
            dateDict[dateStr].push(item);
          }
        });

        // 让 YYYY-MM-DD 降序排序，并为每个 YYYY-MM-DD 的 list 按照 date 降序排序
        const dateGroups = Object.keys(dateDict)
          .sort((a, b) => new Date(b) - new Date(a))
          .reduce((obj, key) => {
            obj[key] = dateDict[key].sort((a, b) => new Date(b.date) - new Date(a.date));
            return obj;
          }, {});
        
        // 根据参数 显示指定条数
        const options = block.kwargs
        const limit = 'limit' in options
          ? options.limit || Infinity
          : Infinity
        Object.keys(dateGroups).forEach(key => {
          dateGroups[key] = dateGroups[key].slice(0, limit);
        });

        // 构建头部内容
        /*
          <div id="tags" class="tags">
            <p>
              <i class="fa fa-tags" aria-hidden="true"></i>
              <a href="#2023-08-26">2023-08-26</a>
            </p>
          </div>
        */
        const header = Object.keys(dateGroups)
          .map(date => {
            return `<a href="#${date}">${date}</a>`;
          }).join('\n');
        const headerHtml = `<div id="tags" class="tags"><p><i class="fa fa-calendar" aria-hidden="true"></i>${header}</p></div>`;

        // 构建展示内容
        /*
          ###### 2023-8-26

          + [path > to > 牧羊少年奇幻之旅](/path/to/牧羊少年奇幻之旅.md)
          + ...
        */
        const content = Object.keys(dateGroups)
          .map(date => {
            const dateGroup = dateGroups[date];
            // const dateStr = date.replace(/-/g, '.');
            const dateStr = date;
            const dateContent = dateGroup.map(item => {
              const path = `/${item.path}`;
              // path: path/to/牧羊少年奇幻之旅.md
              // fullTitle: path > to > 牧羊少年奇幻之旅.md
              var pathArray = item.path.split('/');
              // 如果 pathArray 长度等于 1. 并且文章有 title 属性且 title 属性不为空，则使用 title 作为 fullTitle
              // 针对 README.md/dates.md/tags.md 这种情况
              if (pathArray.length === 1 && item.title && item.title !== '') {
                pathArray = [item.title];
              }
              // 如果 pathArray 长度大于 1. 并且最后一个元素是 README.md(大小写)，则删除最后一个元素
              // 针对 path/to/README.md 这种情况
              if (pathArray.length > 1 && pathArray[pathArray.length - 1].toLowerCase() === 'readme.md') {
                pathArray.pop();
              }
              const fullTitle = pathArray.join(' > ');
              return `<li><a href="${path}">${fullTitle}</a></li>`;
            }).join('\n');
            return `<h6>${dateStr}</h6><ul>${dateContent}</ul>`;
          })
          .join('\n');
        const contentHtml = `<div class="date-list">${content}</div>`
        
        return headerHtml + contentHtml;
      }
    },

    // 渲染 tagsinfo 内容
    tagsinfo: {
      process(block) {
        // 构建数据结构
        /*
          tagsDict = {
            "读书": [
              {
                "title": "牧羊少年奇幻之旅.md",
                "path": "path/to/牧羊少年奇幻之旅.md",
                "date": "2023-08-26T01:16:00.000Z",
                "tags": ["读书", "笔记"]
              },
            ],
            "笔记": [
              {
                ...
                "tags": ["读书", "笔记"]
              },
              {
                ...
                tags: ["笔记"]
              }
            ]
          }
        */
        // 首先遍历 jsonData，如果 tags 属性有值（有可能为空列表，插入到 tagsDict 中
        var tagsDict = {};
        Object.keys(jsonData).forEach(key => {
          var item = jsonData[key];
          item.tags.forEach(tag => {
            tagsDict[tag] = tagsDict[tag] || [];
            tagsDict[tag].push(item);
          });
        });

        // 根据参数 显示指定条数
        const options = block.kwargs
        const limit = 'limit' in options
          ? options.limit || Infinity
          : Infinity
        Object.keys(tagsDict).forEach(key => {
          tagsDict[key] = tagsDict[key].slice(0, limit);
        });

        // 构建头部内容
        /*
          <div id="tags" class="tags">
            <p>
              <i class="fa fa-tags" aria-hidden="true"></i>
              <a href="#读书">读书</a>
              <a href="#笔记">笔记</a>
            </p>
          </div>
        */
        const header = Object.keys(tagsDict)
          .map(tag => {
            return `<a href="#${tag}">${tag}</a>`;
          }).join('\n');
        const headerHtml = `<div id="tags" class="tags"><p><i class="fa fa-tags" aria-hidden="true"></i>${header}</p></div>`;
        // 构建展示内容
        /*
          ###### 读书

          + [path > to > 牧羊少年奇幻之旅](/path/to/牧羊少年奇幻之旅.md)
          + ...
        */
        const content = Object.keys(tagsDict)
          .map(tag => {
            const tagGroup = tagsDict[tag];
            const tagContent = tagGroup.map(item => {
              const path = `/${item.path}`;
              // path: path/to/牧羊少年奇幻之旅.md
              // fullTitle: path > to > 牧羊少年奇幻之旅.md
              var pathArray = item.path.split('/');
              // 如果 pathArray 长度等于 1. 并且文章有 title 属性且 title 属性不为空，则使用 title 作为 fullTitle
              // 针对 README.md/dates.md/tags.md 这种情况
              if (pathArray.length === 1 && item.title && item.title !== '') {
                pathArray = [item.title];
              }
              // 如果 pathArray 长度大于 1. 并且最后一个元素是 README.md(大小写)，则删除最后一个元素
              // 针对 path/to/README.md 这种情况
              if (pathArray.length > 1 && pathArray[pathArray.length - 1].toLowerCase() === 'readme.md') {
                pathArray.pop();
              }
              const fullTitle = pathArray.join(' > ');
              return `<li><a href="${path}">${fullTitle}</a></li>`;
            }).join('\n');
            return `<h6>${tag}</h6><ul>${tagContent}</ul>`;
          }).join('\n');
        const contentHtml = `<div class="tags-list">${content}</div>`
        
        return headerHtml + contentHtml;
      }
    }
  }
}
