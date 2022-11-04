
function checkFeatureEnabled(featureName) {
    return this.settings
        .get_strv("enabled-features")
        .includes(featureName)
}
