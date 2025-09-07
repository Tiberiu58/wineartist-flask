'use client'
import { useEffect } from 'react'

export default function Home() {
    useEffect(() => {
        (async () => {
            const [{ default: Lenis }, { gsap }, { default: ST }] = await Promise.all([
                import('@studio-freight/lenis'),
                import('gsap'),
                import('gsap/ScrollTrigger'),
            ])
            gsap.registerPlugin(ST)
            const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
            lenis.on('scroll', ST.update)
            gsap.ticker.add((t) => lenis.raf(t * 1000))

            void import('./three-hero')   // setează canvas + animații 3D fără a bloca fetch-ul

            const base = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001'
            const res = await fetch(`${base}/api/products`)
            const products: Array<{ id: string; name: string; region: string; year: number; price: number }> = await res.json()
            const grid = document.getElementById('grid')!
            grid.innerHTML = products.map((p) =>`
        <div class="card">
          <div class="name">${p.name}</div>
          <div class="meta">${p.region} · ${p.year}</div>
          <div class="price">€${(p.price/100).toFixed(2)}</div>
          <button class="buy" data-id="${p.id}">Buy</button>
        </div>`).join('')

            grid.addEventListener('click', async (e: MouseEvent) => {
                const t = e.target as HTMLElement
                if (!t.classList.contains('buy')) return
                const id = t.getAttribute('data-id')!
                const r = await fetch(`${base}/api/checkout`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: [{ id, qty: 1 }] })
                })
                const data = await r.json()
                if (data.url) window.location.href = data.url
                else alert(data.message || 'Checkout stubbed.')
            })
        })()
    }, [])

    return (
        <main>
            <header className="hero">
                <canvas id="scene" />
                <div className="hero-copy">
                    <h1>Wine reimagined as light & space</h1>
                    <p>Scroll to explore.</p>
                </div>
            </header>
            <div id="scroll-sections">
                <section className="panel"><h2>Craft & Provenance</h2></section>
                <section className="panel alt"><h2>Art on Glass</h2></section>
                <section className="panel"><h2>Cellar to Door</h2></section>
            </div>
            <section className="shop">
                <h2>Shop</h2>
                <div id="grid" className="grid" />
            </section>

            <style jsx global>{`
        body{background:#0b0b0d;color:#eaeaea;font-family:ui-sans-serif,system-ui;margin:0}
        .hero{position:relative;height:100vh;display:grid;place-items:center;overflow:hidden}
        #scene{position:absolute;inset:0;width:100%;height:100%}
        .hero-copy{text-align:center;position:relative;z-index:1}
        #scroll-sections .panel{height:100vh;display:grid;place-items:center;border-top:1px solid rgba(255,255,255,.06)}
        #scroll-sections .panel.alt{background:rgba(255,255,255,.02)}
        .shop{padding:96px 24px}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}
        .card{background:#111114;border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:14px}
      `}</style>
        </main>
    )
}
