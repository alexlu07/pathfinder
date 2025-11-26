# Pathfinder

Simple extension to automatically export the active editor paths to `/tmp`
- Exports editor path to `/tmp/editor_path.txt`
- Exports workspace folder to `/tmp/folder_path.txt`

## Usage

The following example usages can be placed in your `~/.zshrc` or `~/.bashrc`

### Custom navigation functions

```
here() {
    if [ -f /tmp/editor_path.txt ]; then
        cd "$(dirname "$(cat /tmp/editor_path.txt)")"
    fi
}

home() {
    if [ -f /tmp/folder_path.txt ]; then
        cd "$(dirname "$(cat /tmp/folder_path.txt)")"
    fi
}
```

### VSCode terminal startup
```
if [ "$TERM_PROGRAM" = "vscode" ]; then
    home
fi
```