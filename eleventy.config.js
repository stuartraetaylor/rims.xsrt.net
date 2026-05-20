module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/scripts");
  // style/main.css is built by Tailwind CLI, not passthrough copied
  // Keep passthrough for any non-Tailwind CSS (will be removed later)
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
