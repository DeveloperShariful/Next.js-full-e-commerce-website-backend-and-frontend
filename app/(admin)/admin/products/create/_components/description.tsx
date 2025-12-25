// app/admin/products/create/_components/description.tsx

import { ComponentProps } from "../types";
// পাথ ঠিক আছে কিনা নিশ্চিত হয়ে নিন
import RichTextEditor from "./RichTextEditor"; 

export default function Description({ data, updateData }: ComponentProps) {
    return (
        <div className="mb-5">
            {/* এখানে আমরা কাস্টম এডিটর ব্যবহার করছি */}
            <RichTextEditor 
                label="Product Description"
                value={data.description} 
                onChange={(val) => updateData('description', val)} 
            />
        </div>
    );
}