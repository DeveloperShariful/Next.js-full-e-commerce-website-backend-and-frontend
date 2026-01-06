// app/admin/products/create/_components/short_description.tsx

import { useFormContext } from "react-hook-form";
import RichTextEditor from "./RichTextEditor";
import { ProductFormData } from "../types";

export default function ShortDescription() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const shortDescription = watch("shortDescription") || "";

    return (
        <div className="mt-5">
            <RichTextEditor 
                label="Product Short Description"
                value={shortDescription} 
                onChange={(val) => setValue("shortDescription", val, { shouldDirty: true, shouldValidate: true })} 
            />
        </div>
    );
}