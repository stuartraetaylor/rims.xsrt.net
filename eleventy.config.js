module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/scripts");
  eleventyConfig.addPassthroughCopy("src/style");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
