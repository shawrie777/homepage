/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useState, useEffect, useRef } from "react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult
} from "@hello-pangea/dnd";

import styles from "./notes.module.css"

type Note = {
    id: string;
    title: string;
    text: string;
};

export default function Notepad() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [active, setActive] = useState(0);
    const [editingTitle, setEditingTitle] = useState<string | null>(null);

    const textRef = useRef<HTMLTextAreaElement>(null);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("notes-tabs");
        if (saved) {
            const parsed = JSON.parse(saved);
            setNotes(parsed.notes);
            setActive(parsed.active ?? 0);
        } else {
            // Start with one empty note
            setNotes([{ id: crypto.randomUUID(), title: "Note 1", text: "" }]);
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem("notes-tabs", JSON.stringify({ notes, active }));
    }, [notes, active]);

    const addNote = () => {
        const newNote = {
            id: crypto.randomUUID(),
            title: `Note ${notes.length + 1}`,
            text: ""
        };
        setNotes([...notes, newNote]);
        setActive(notes.length);
        textRef.current!.focus();
    };

    const removeNote = (index: number) => {
        const newNotes = notes.filter((_, i) => i !== index);
        if (!newNotes.length) {
            const newNote = {
                id: crypto.randomUUID(),
                title: `Note 1`,
                text: ""
            };
            setNotes([newNote]);
        } else {
            setNotes(newNotes);

            if (active >= newNotes.length) {
                setActive(newNotes.length - 1);
            }
        }
    };

    const renameNote = (index: number, title: string) => {
        const updated = [...notes];
        updated[index].title = title;
        setNotes(updated);
    };

    const updateText = (text: string) => {
        const updated = [...notes];
        updated[active].text = text;
        setNotes(updated);
    };

    const onDragEnd = (result : DropResult) => {
        if (!result.destination) return;

        const reordered = Array.from(notes);
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);

        setNotes(reordered);

        // Update active index
        if (result.source.index === active) {
            setActive(result.destination.index);
        } else if (
            result.source.index < active &&
            result.destination.index >= active
        ) {
            setActive(active - 1);
        } else if (
            result.source.index > active &&
            result.destination.index <= active
        ) {
            setActive(active + 1);
        }
    };

    return (
        <div className={styles.notepad}>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="tabs" direction="horizontal">
                    {provided => (
                        <div
                            className={styles.tabs}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {notes.map((note, i) => (
                                <Draggable
                                    key={note.id}
                                    draggableId={note.id}
                                    index={i}
                                >
                                    {(drag) => (
                                        <div
                                            className={`${styles.tab} ${
                                                i === active ? styles.activeTab : ""
                                            }`}
                                            ref={drag.innerRef}
                                            {...drag.draggableProps}
                                            {...drag.dragHandleProps}
                                            onClick={() => setActive(i)}
                                            onDoubleClick={() =>
                                                setEditingTitle(note.id)
                                            }
                                        >
                                            {editingTitle === note.id ? (
                                                <input
                                                    autoFocus
                                                    className={styles.tabEdit}
                                                    value={note.title}
                                                    onChange={(e) =>
                                                        renameNote(i, e.target.value)
                                                    }
                                                    onBlur={() =>
                                                        setEditingTitle(null)
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter")
                                                            setEditingTitle(null);
                                                    }}
                                                />
                                            ) : (
                                                <span>{note.title}</span>
                                            )}

                                            
                                                <button
                                                    className={styles.closeTab}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeNote(i);
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}

                            <button className={styles.addTab} onClick={addNote}>
                                +
                            </button>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <textarea
                ref={textRef}
                className={styles.notesArea}
                value={notes[active]?.text}
                onChange={(e) => updateText(e.target.value)}
            />
        </div>
    );
}
