import { RegisterForm } from "@/components/register-form";
import { getAllowedMenteeBatches } from "@/lib/registration-batches";

export default async function RegisterPage() {
    const availableBatches = await getAllowedMenteeBatches();

    return <RegisterForm availableBatches={availableBatches} />;
}
