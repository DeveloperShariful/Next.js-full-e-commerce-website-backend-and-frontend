// app/admin/products/create/_components/short_description.tsx

import { ComponentProps } from "../types";
// পাথ ঠিক আছে কিনা নিশ্চিত হয়ে নিন
import RichTextEditor from "./RichTextEditor"; 

export default function ShortDescription({ data, updateData }: ComponentProps) {
    return (
        <div className="mt-5">
            {/* এখানেও একই এডিটর ব্যবহার হচ্ছে */}
            <RichTextEditor 
                label="Product Short Description"
                value={data.shortDescription} 
                onChange={(val) => updateData('shortDescription', val)} 
            />
        </div>
    );
}