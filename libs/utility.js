// this module exports many useful functions
// for simplify main codes

function addChildWithIndex(parent,child,index) {
    let children = parent.get_children()
    let tmp = []
    let tmp_visible = []
    for (let index = index+1; index<children.length; index++) {
        let item = children[index]
        tmp.push(item)
        tmp_visible.push(item.visible)
        parent.remove_child(item)
    }
    parent.add_child(child);
    for (let index = 0; index<tmp.length; index++) {
        let item = tmp[index]
        parent.add_child(item)
        item.visible = tmp_visible[index]
    }
}
