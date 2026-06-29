"use client";
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Eraser, PenTool, Sparkles, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

export default function WhiteboardPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [lineWidth, setLineWidth] = useState(3);
  const [notes, setNotes] = useState<{ id: string; text: string; x: number; y: number; color: string }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set real size
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        ctx.fillStyle = "transparent";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.beginPath();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = isErasing ? 20 : lineWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = isErasing ? "#121212" : color; // Assuming dark background if erasing, normally we use globalCompositeOperation

    if (isErasing) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const addNote = () => {
    const newNote = {
      id: Date.now().toString(),
      text: "",
      x: 100 + Math.random() * 50,
      y: 100 + Math.random() * 50,
      color: ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8"][Math.floor(Math.random() * 4)]
    };
    setNotes([...notes, newNote]);
  };

  const updateNote = (id: string, text: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, text } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const sendToAI = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas to combine drawing and notes for AI vision
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Fill background
    tempCtx.fillStyle = "#1e1e1e";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw main canvas
    tempCtx.drawImage(canvas, 0, 0);

    // Draw notes
    tempCtx.font = "16px sans-serif";
    notes.forEach(note => {
      tempCtx.fillStyle = note.color;
      tempCtx.fillRect(note.x, note.y, 200, 150);
      tempCtx.fillStyle = "#000";
      
      const lines = note.text.split("\n");
      lines.forEach((line, i) => {
        tempCtx.fillText(line, note.x + 10, note.y + 30 + (i * 20));
      });
    });

    const imageData = tempCanvas.toDataURL("image/png");

    setIsAnalyzing(true);
    try {
      const res = await apiClient.post("/whiteboard/analyze", { image: imageData });
      toast.success(res.data.message || "AI analyzed your whiteboard and added items!");
    } catch (err) {
      toast.error("Failed to analyze whiteboard.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <h1 className="text-2xl font-bold">Whiteboard</h1>
        <div className="flex items-center gap-2">
          <Button variant={isErasing ? "outline" : "default"} onClick={() => setIsErasing(false)}>
            <PenTool className="h-4 w-4 mr-2" /> Draw
          </Button>
          <Button variant={isErasing ? "default" : "outline"} onClick={() => setIsErasing(true)}>
            <Eraser className="h-4 w-4 mr-2" /> Erase
          </Button>
          <Button variant="outline" onClick={addNote}>
            <Plus className="h-4 w-4 mr-2" /> Sticky Note
          </Button>
          <Button variant="outline" onClick={clearCanvas}>Clear</Button>
          
          <Button onClick={sendToAI} disabled={isAnalyzing} className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 shadow-lg">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Analyze with AI
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-dot-pattern">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 cursor-crosshair touch-none"
        />

        {/* Sticky Notes Overlay */}
        {notes.map(note => (
          <div
            key={note.id}
            className="absolute p-3 rounded shadow-lg flex flex-col"
            style={{ left: note.x, top: note.y, width: 200, height: 150, backgroundColor: note.color }}
          >
            <div className="flex justify-end mb-1">
              <button onClick={() => deleteNote(note.id)} className="text-black/50 hover:text-black">✖</button>
            </div>
            <textarea
              value={note.text}
              onChange={(e) => updateNote(note.id, e.target.value)}
              className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-black placeholder:text-black/40 p-0 text-sm"
              placeholder="Type note here..."
            />
          </div>
        ))}
      </div>
    </div>
  );
}
