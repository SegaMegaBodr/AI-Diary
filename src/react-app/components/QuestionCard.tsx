interface QuestionCardProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function QuestionCard({ question, value, onChange, placeholder }: QuestionCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100/50 hover:shadow-md transition-all duration-300">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{question}</h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-32 p-4 bg-blue-50/50 border border-blue-200/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400"
        rows={4}
      />
    </div>
  );
}
