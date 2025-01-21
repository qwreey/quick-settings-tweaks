$ID:load() {
    lib:path-alloc2 "PATHALLOC_$ID" ./scripts :
}

$ID:unload() {
    lib:path-free "PATHALLOC_$ID"
}
