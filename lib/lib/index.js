// dsh-ui-font — node half. Pure UI plugin: the empty apply exists so the
// plugin appears in the host cordis.yml / Loader; the browser half ships via
// exports["./client"], discovered through the package.json dsh.client
// declaration. All state is browser-local (localStorage); no host config.
/** Host plugin body — no host-side behavior for this surface plugin. */
function apply() {}
export { apply };
