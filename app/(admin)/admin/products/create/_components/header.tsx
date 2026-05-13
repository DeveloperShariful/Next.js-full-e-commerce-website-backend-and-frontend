// app/admin/products/create/_components/header.tsx

"use client";

interface Props {
    loading: boolean;
    onSubmit: () => void; // Keeping prop for backwards compatibility but not used here anymore
    title: string;
    isEdit: boolean;
}

export default function Header({ title, isEdit }: Props) {
    return (
        <div className="flex items-center px-4 md:px-6 py-4">
            <h1 className="text-[23px] font-normal text-[#1d2327]">
                {isEdit ? "Edit product" : "Add new product"}
            </h1>
        </div>
    );
}