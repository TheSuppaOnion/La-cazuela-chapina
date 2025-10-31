import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import MainBanner from "../components/MainBanner";
import Combos from "../components/Combos";

const ChatBox = () => {
  const { user, products, combos, API_URL_DIRECT } = useAppContext();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);

  const send = async (text) => {
  if (!text || !text.trim()) return;
  const userMsg = { role: 'user', content: text };
  // Append the user's message to history immediately so it's visible
  setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      // Build a richer structured context (small JSON) so the LLM knows available combos/products
      const parsePrice = (v) => {
        if (v === null || v === undefined) return null;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          // remove currency symbols and whitespace
          let s = v.replace(/[€$Qq\s]/g, '').trim();
          // replace comma decimal with dot if present and only one comma
          if (s.indexOf(',') !== -1 && s.indexOf('.') === -1) s = s.replace(',', '.');
          // remove thousands separators
          s = s.replace(/\.(?=\d{3,})/g, '');
          const n = parseFloat(s);
          return Number.isFinite(n) ? n : null;
        }
        return null;
      };

      const normalize = (it) => {
        const name = it?.Nombre_producto ?? it?.NOMBRE_PRODUCTO ?? it?.nombre_producto ?? it?.nombre ?? it?.Nombre ?? it?.name ?? it?.title ?? null;
        const priceRaw = it?.Precio_base ?? it?.PRECIO_BASE ?? it?.Precio ?? it?.price ?? it?.PRECIO ?? null;
        const price = parsePrice(priceRaw);
        const type = it?.Tipo_producto ?? it?.TIPO_PRODUCTO ?? it?.type ?? null;
        const attributes = it?.Atributos ?? it?.ATRIBUTOS ?? it?.attributes ?? null;
        const available = it?.Disponible ?? it?.DISPONIBLE ?? it?.available ?? null;
        return {
          id: it?.ID_Producto ?? it?.ID ?? it?.id ?? it?.Id ?? null,
          name: (typeof name === 'string' && name.trim().length > 0) ? name.trim() : null,
          rawNameCandidates: [it?.Nombre_producto, it?.NOMBRE_PRODUCTO, it?.nombre_producto, it?.nombre, it?.Nombre, it?.name, it?.title].filter(Boolean),
          type,
          price,
          attributes,
          available,
        };
      };

      const topCombos = (combos || []).slice(0,5).map(normalize);
      const topProducts = (products || []).slice(0,6).map(normalize).slice(0,5);

      const contextObj = {
        user: { id: user?.id ?? user?.ID ?? null, name: user?.name ?? user?.Nombre_usuario ?? 'cliente' },
        combos: topCombos,
        products: topProducts,
      };

      const systemMessage = {
        role: 'system',
        content: `Eres un asistente que habla como un vendedor amable y como un usuario final que ayuda a escoger comida en una taquería.
Usa EXCLUSIVAMENTE el contexto JSON que se te entrega y NO inventes nombres ni detalles que no estén presentes.
Responde en lenguaje natural, cercano y orientado al cliente (no en tono de desarrollador ni con instrucciones técnicas).
Responde SOLO en formato JSON válido, SIN texto adicional. El JSON debe tener esta forma:
{
  "summary": [{ "type": "Combo|Producto", "name": string|null, "price": number|null, "detail": string|null }],
  "recommendations": [{ "title": string, "description": string, "actions": [string] }]
}
Si algún item no tiene nombre conocido, usa null para "name" y añade "missingName": true en ese objeto. Responde en español y usa frases cortas y directas enfocadas al cliente.`
      };

      const userContent = `Contexto: ${JSON.stringify(contextObj)}\nPetición: ${text}`;
      const messagesPayload = [systemMessage, { role: 'user', content: userContent }];

      // build assistant message: prefer JSON parsing into a single assistant text message
  const res = await fetch(`${API_URL_DIRECT}/llm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: messagesPayload }) });
      const data = await res.json();
      const rawContent = data?.content ?? JSON.stringify(data?.raw ?? data);
      // Try to parse JSON-only responses. If parse succeeds, pretty-print JSON in assistant message.
      try {
        const parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
        setParsedResult(parsed);
        // Convert parsed recommendations into a single assistant string (no developer formatting)
        let assistantText = '';
        if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
          assistantText = parsed.recommendations.map(r => {
            const title = r.title ? String(r.title).trim() : '';
            const desc = r.description ? String(r.description).trim() : '';
            return title + (desc ? '\n' + desc : '');
          }).join('\n\n');
        } else if (Array.isArray(parsed.summary) && parsed.summary.length > 0) {
          assistantText = parsed.summary.map(s => {
            const name = s.name ?? s.type ?? 'Ítem';
            const price = s.price != null ? `Precio: Q${s.price}` : '';
            const detail = s.detail ? String(s.detail) : '';
            return `${name}${price ? ' — ' + price : ''}${detail ? '\n' + detail : ''}`;
          }).join('\n\n');
        } else {
          assistantText = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
        }
        // push single assistant message into history
        setMessages((m) => [...m, { role: 'assistant', content: assistantText }]);
      } catch (parseErr) {
        // Not valid JSON — keep parsedResult null and store raw assistant reply so we can show it labeled as recommendation
        setParsedResult(null);
        const shown = (typeof rawContent === 'string' && rawContent.length > 2000) ? rawContent.slice(0,2000) + '... (truncated)' : String(rawContent);
        setMessages((m) => [...m, { role: 'assistant', content: shown }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Error al llamar al LLM: ' + (err.message || err) }]);
    } finally {
      setLoading(false);
    }
  };

  const chatRef = useRef(null);

  // auto-scroll when messages or parsedResult change
  useEffect(() => {
    try {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    } catch (e) {
      // ignore
    }
  }, [messages, parsedResult, open]);

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 max-w-md w-full z-50">
      <div className="bg-white border rounded-lg shadow-lg">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="font-medium">Asistente</div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setOpen(!open); }} className="text-sm px-2 py-1 border rounded">{open ? 'Ocultar' : 'Recomendar'}</button>
          </div>
        </div>
        {open && (
          <div className="p-3">
            <div
              ref={chatRef}
              className="mb-2 border p-2 rounded bg-gray-50"
              // allow the chat area to auto-grow until it reaches maxHeight, then scroll
              style={{ minHeight: 120, maxHeight: '60vh', overflowY: 'auto', height: 'auto' }}
            >
              {/* Chat-style bubbles: usuario a la derecha, asistente a la izquierda */}
              <div className="flex flex-col gap-2">
                {/* Render full history from messages (user + assistant) in chat bubble format */}
                {messages.length > 0 ? (
                  messages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${m.role === 'user' ? 'bg-sky-500 text-white rounded-lg rounded-br-none' : 'bg-white border rounded-lg rounded-bl-none'} max-w-[78%] px-3 py-2 text-sm`}>
                        <strong className="block">{m.role === 'user' ? 'Usuario:' : 'Asistente:'}</strong>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">Pide recomendaciones sobre combos o productos escribiendo abajo.</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 border p-2 rounded" placeholder="Pregunta sobre combos o pide sugerencias..." />
              <button disabled={loading} onClick={() => { send(input); setInput(''); }} className="px-3 py-2 bg-sky-500 text-white rounded">{loading ? '...' : 'Enviar'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Home = () => {
  return (
    <div className="mt-10">
      <MainBanner />
      <Combos />
      <ChatBox />
    </div>
  );
};

export default Home;
