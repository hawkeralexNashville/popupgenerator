import "./globals.css";import type { Metadata } from "next";
export const metadata:Metadata={title:"Popup Generator",description:"Create, test, and optimize newsletter signup popups."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
