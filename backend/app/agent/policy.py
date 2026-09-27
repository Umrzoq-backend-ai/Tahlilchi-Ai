import ast

from app.errors import AppError

BLOCKED_NAMES = {
    "open",
    "exec",
    "eval",
    "compile",
    "getattr",
    "setattr",
    "delattr",
    "globals",
    "locals",
    "vars",
    "input",
    "print",
    "breakpoint",
    "help",
    "exit",
    "quit",
}
BLOCKED_ATTRIBUTES = {
    "eval",
    "query",
    "system",
    "popen",
    "load",
    "save",
    "savez",
    "memmap",
    "fromfile",
    "tofile",
    "ctypes",
    "lib",
    "io",
    "testing",
}
ALLOWED_TO = {
    "to_period",
    "to_timestamp",
    "to_datetime",
    "to_numeric",
    "to_frame",
    "tolist",
    "to_list",
    "to_numpy",
    "to_pydatetime",
}


def check_code(code: str) -> None:
    # Defense in depth ONLY. Bubblewrap namespaces and resource limits are the boundary.
    if len(code) > 12000:
        raise AppError("CODE_POLICY", "Agent kodi hajm limitidan oshdi.")
    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        raise AppError("CODE_SYNTAX", f"SyntaxError, line {exc.lineno}") from exc
    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom, ast.Global, ast.Nonlocal)):
            raise AppError("CODE_POLICY", "Import va global muhitga murojaatga ruxsat yo‘q.")
        if isinstance(node, ast.Name) and (node.id in BLOCKED_NAMES or node.id.startswith("_")):
            raise AppError("CODE_POLICY", "Agent kodi ruxsat etilmagan amalni so‘radi.")
        if isinstance(node, ast.Attribute):
            name = node.attr
            if (
                name.startswith("_")
                or name.startswith("read_")
                or name in BLOCKED_ATTRIBUTES
                or (name.startswith("to_") and name not in ALLOWED_TO)
            ):
                raise AppError("CODE_POLICY", "Agent kodi ruxsat etilmagan amalni so‘radi.")
