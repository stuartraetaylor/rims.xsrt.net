const { execSync } = require("child_process");

module.exports = function(eleventyConfig) {
  // Cache busting: append build timestamp to asset URLs
  const buildVersion = Date.now().toString(36);
  eleventyConfig.addFilter("cacheBust", function(url) {
    return url + "?v=" + buildVersion;
  });

  eleventyConfig.addFilter("gitLastModified", function(filePath) {
    let date;
    try {
      date = execSync(`git log -1 --format=%cI -- "${filePath}"`, { encoding: "utf-8" }).trim();
    } catch { /* Command failed, ignore. */ }

    return date || new Date().toISOString();
  });

  eleventyConfig.addPassthroughCopy({
    "node_modules/jquery/dist/jquery.min.js": "scripts/jquery/jquery.min.js"
  });
  eleventyConfig.addPassthroughCopy("src/scripts");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
