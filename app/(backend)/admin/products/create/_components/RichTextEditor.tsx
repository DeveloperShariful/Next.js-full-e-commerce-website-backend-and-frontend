// app(backend)/admin/products/create/_components/RichTextEditor.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@tinymce/tinymce-react").then((mod) => mod.Editor), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-500">Loading Editor...</div>,
});

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
    id?: string; 
}

export default function RichTextEditor({ value, onChange, label, id }: RichTextEditorProps) {
    const [editorValue, setEditorValue] = useState("");

    // 🚀 FIXED: Clean up WordPress junk formatting on first load
    useEffect(() => {
        if (value && !editorValue) {
            const cleanedValue = value
                .replace(/\\n/g, '') // Remove literal \n strings
                .replace(/\\r/g, '') // Remove \r
                .replace(/\n/g, '')  // Remove actual newlines in source code
                .replace(/>\s+</g, '><') // Remove empty spaces between HTML tags
                .trim();
                
            setEditorValue(cleanedValue);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleEditorChange = (content: string) => {
        setEditorValue(content);
        // Also send clean data back to the form state
        const cleanContentForDb = content
                .replace(/\\n/g, '') 
                .replace(/\n/g, '');
        onChange(cleanContentForDb);
    };

    const editorId = id || `editor-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    return (
        <div className="bg-white border border-gray-300 rounded-sm shadow-sm mt-2 flex flex-col h-full w-full">
            
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-300 bg-gray-50">
                <span className="font-bold text-sm text-gray-800 uppercase tracking-wide">
                    {label}
                </span>
                <span className="text-xs text-blue-600 font-bold bg-blue-50 border border-blue-200 px-2 py-1 rounded">
                    WordPress Compatible
                </span>
            </div>

            <div className="relative flex-1 w-full">
                <Editor
                    id={editorId} 
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API} 
                    value={editorValue}
                    onEditorChange={handleEditorChange}
                    init={{
                        height: 400,
                        menubar: false,
                        statusbar: true,
                        plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                            'insertdatetime', 'media', 'table', 'help', 'wordcount'
                        ],
                        toolbar: 
                            'blocks | ' +
                            'bold italic underline strikethrough | ' +
                            'alignleft aligncenter alignright alignjustify | ' +
                            'bullist numlist outdent indent | ' +
                            'link image media | ' +
                            'removeformat | code | fullscreen',
                        
                        valid_elements: '*[*]', 
                        extended_valid_elements: 'script[src|async|defer|type|charset],style,div[*],span[*]', 
                        
                        // 🚀 FIXED: WordPress uses 'p' for root blocks, not false
                        forced_root_block: 'p', 
                        
                        convert_urls: false, 
                        entity_encoding: "raw", 
                        
                        content_style: `
                            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; margin: 16px; }
                            div, span, section { box-sizing: border-box; }
                            p { margin-bottom: 1em; }
                        `,
                        branding: false, 
                    }}
                />
            </div>
            
        </div>
    );
}