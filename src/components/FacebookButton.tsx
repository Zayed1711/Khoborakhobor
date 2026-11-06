import { FACEBOOK_PAGE_URL } from "@/lib/links";

/** Link to our Facebook page, with the Facebook mark. */
export default function FacebookButton({ label = "ফেসবুক পেজে যোগাযোগ করুন", className = "" }: { label?: string; className?: string }) {
  return (
    <a
      href={FACEBOOK_PAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#1877f2] hover:bg-[#166fe5] text-white text-xs font-semibold px-3.5 py-2 transition ${className}`}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
      </svg>
      <span>{label}</span>
    </a>
  );
}
