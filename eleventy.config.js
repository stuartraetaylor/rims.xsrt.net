module.exports = function(eleventyConfig) {
  // Cache busting: append build timestamp to asset URLs
  const buildVersion = Date.now().toString(36);
  eleventyConfig.addFilter("cacheBust", function(url) {
    return url + "?v=" + buildVersion;
  });

  eleventyConfig.addPassthroughCopy("src/scripts");
  // style/main.css is built by Tailwind CLI, not passthrough copied
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
