// app/admin/products/create/_components/description.tsx

import { useFormContext } from "react-hook-form";
import RichTextEditor from "./RichTextEditor";
import { ProductFormData } from "../types";

export default function Description() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const description = watch("description") || "";

    return (
        <div className="mb-5">
            <RichTextEditor 
                label="Product Description"
                value={description} 
                onChange={(val) => setValue("description", val, { shouldDirty: true, shouldValidate: true })} 
            />
        </div>
    );
}