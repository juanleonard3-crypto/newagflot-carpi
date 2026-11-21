#!/usr/bin/env python3
"""Crea agents/<id>/ con agent.json y la carpeta knowledge/. Ejecutar desde la raíz del proyecto."""
import argparse, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
p = argparse.ArgumentParser()
p.add_argument("--id", required=True)
p.add_argument("--name", required=True)
p.add_argument("--specialty", required=True)
p.add_argument("--greeting", default="")
p.add_argument("--color", default="#2E7D32")
p.add_argument("--accent", default="#00ACC1")
a = p.parse_args()
if not re.fullmatch(r"[a-z0-9-]+", a.id):
    raise SystemExit("--id solo admite minúsculas, números y guiones")
d = ROOT / "agents" / a.id
if d.exists():
    raise SystemExit(f"Ya existe {d}")
(d / "knowledge").mkdir(parents=True)
agente = {
    "id": a.id, "name": a.name, "specialty": a.specialty,
    "greeting": a.greeting or f"¡Hola! Soy {a.name}, especialista en {a.specialty}. ¿En qué te ayudo?",
    "color": a.color, "accent": a.accent,
    "suggested": [f"¿Qué sabés de {a.specialty}?"],
    "instructions": (f"Sos {a.name}, especialista en {a.specialty}. Respondés en español rioplatense, con voseo, "
                     "de forma amable y clara. No inventás datos: si no sabés algo o no está en tu material, lo decís."),
}
(d / "agent.json").write_text(json.dumps(agente, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Creado {d}. Poné el conocimiento en {d / 'knowledge'}/*.md y ajustá 'instructions' en agent.json")
