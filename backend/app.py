from flask import Flask, jsonify, request, render_template, url_for
from flask_cors import CORS
import os, stripe

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}}, supports_credentials=True)

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

PRODUCTS = [
    {"id": "bordeaux-18", "name": "Bordeaux Rouge 2018", "price": 3200, "region": "Bordeaux", "year": 2018},
    {"id": "burgundy-20", "name": "Bourgogne Pinot Noir 2020", "price": 4100, "region": "Burgundy", "year": 2020},
    {"id": "loire-21", "name": "Sancerre Blanc 2021", "price": 2900, "region": "Loire", "year": 2021},
    {"id": "rhine-19", "name": "Riesling Reserve 2019", "price": 3400, "region": "Rhine", "year": 2019},
]

@app.template_filter("euro")
def euro(cents: int) -> str:
    return f"€{cents/100:.2f}"

@app.get("/")
def index_page():
    return render_template("index.html", products=PRODUCTS)

@app.get("/api/health")
def health():
    return {"ok": True}

@app.get("/api/products")
def api_products():
    return jsonify(PRODUCTS)

@app.post("/api/checkout")
def api_checkout():
    data = request.get_json(silent=True) or {}
    items = data.get("items", [])
    catalog = {p["id"]: p for p in PRODUCTS}
    line_items = []
    for it in items:
        pid = it.get("id")
        qty = max(1, int(it.get("qty", 1)))
        if pid in catalog:
            p = catalog[pid]
            line_items.append({
                "price_data": {
                    "currency": "eur",
                    "product_data": {"name": p["name"]},
                    "unit_amount": p["price"]
                },
                "quantity": qty
            })

    if not STRIPE_SECRET_KEY:
        return {"ok": True, "message": "Stripe not configured. Add STRIPE_SECRET_KEY in PyCharm."}

    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=line_items,
        success_url=f"{os.getenv('FRONTEND_ORIGIN','http://localhost:3000')}/success",
        cancel_url=f"{os.getenv('FRONTEND_ORIGIN','http://localhost:3000')}/",
    )
    return {"url": session.url}

if __name__ == "__main__":
    app.run(debug=True, port=5001)
