/**
 * TSpec Configuration
 * 
 * This configuration file specifies which plugins to load and their options.
 * Place this file at the root of your project.
 */

module.exports = {
  // Plugins to load (package names or relative paths)
  plugins: [
    // Built-in protocol plugins
    '@tspec/http',
    // '@tspec/web',      // Uncomment to enable web browser testing
    
    // Custom plugins (relative paths)
    // './plugins/my-custom-protocol'
  ],
  
  // Plugin-specific options
  pluginOptions: {
    '@tspec/http': {
      timeout: 30000,
      followRedirects: true,
      maxRedirects: 5
    },
    '@tspec/web': {
      headless: true,
      timeout: 30000
    }
  }
};
