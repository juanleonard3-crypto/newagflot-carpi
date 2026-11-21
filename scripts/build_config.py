#!/usr/bin/env python3
"""Genera shared-ui/config.js y shared-ui/agents.js a partir de config.json y agents/*."""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FORMATO = (
    "Reglas de formato: tus respuestas se leen en voz alta, así que respondé corto (2 a 5 oraciones), "
    "en lenguaje natural, sin asteriscos, sin listas con viñetas, sin títulos y sin markdown. "
    "Si recibís una captura de pantalla, es lo que el usuario ve en este momento: avisale que la estás "
    "viendo y usala para ayudarlo. Si no recibís captura, no finjas ver su pantalla."
)

def main():
    cfg = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
    (ROOT / "shared-ui" / "config.js").write_text(
        "window.APP_CONFIG = " + json.dumps(cfg, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    agentes = []
    for d in sorted((ROOT / "agents").iterdir()):
        f = d / "agent.json"
        if not f.exists():
            continue
        a = json.loads(f.read_text(encoding="utf-8"))
        conocimiento = []
        for md in sorted((d / "knowledge").glob("*.md")):
            conocimiento.append(md.read_text(encoding="utf-8").strip())
        texto = "\n\n".join(conocimiento)
        palabras = len(texto.split())
        if palabras > 30000:
            print(f"AVISO: {a['id']} tiene {palabras} palabras de conocimiento (más de 30000).", file=sys.stderr)
        system = (f"{a['instructions']}\n\n{FORMATO}\n\n# Material de conocimiento\n{texto}")
        agentes.append({k: a[k] for k in ("id", "name", "specialty", "greeting", "color", "accent", "suggested")} | {"system": system})
        print(f"OK {a['id']}: {palabras} palabras de conocimiento")
    if not agentes:
        sys.exit("No hay agentes en agents/")
    primero = cfg.get("defaultAgent")
    agentes.sort(key=lambda x: x["id"] != primero)
    (ROOT / "shared-ui" / "agents.js").write_text(
        "window.AGENTS = " + json.dumps(agentes, ensure_ascii=False) + ";\n", encoding="utf-8")

if __name__ == "__main__":
    main()
