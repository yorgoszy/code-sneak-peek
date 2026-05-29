import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { ToolCallCard } from "./ToolCallCard";
import type { AgentMessage } from "@/hooks/ai/useAiAgent";

export function MessageBubble({ message }: { message: AgentMessage }) {
  if (message.role === "tool") return null; // collapsed inside assistant bubble in this minimal UI
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <Card className="rounded-none bg-primary text-primary-foreground p-3 max-w-[80%]">
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">
        {message.content && (
          <div className="text-sm prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {Array.isArray(message.tool_calls) &&
          message.tool_calls.map((tc: any, i: number) => (
            <ToolCallCard key={i} name={tc.name} args={tc.args} />
          ))}
      </div>
    </div>
  );
}
