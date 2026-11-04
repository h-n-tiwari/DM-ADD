import Button from "@/components/button";
import Dashboard from "@/components/dashboard";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <Navbar />
      <Dashboard />
      <Button />
      <Footer />
    </>
  );
}
