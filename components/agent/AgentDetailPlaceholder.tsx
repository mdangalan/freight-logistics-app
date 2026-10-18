type AgentDetailPlaceholderProps = {
  message: string;
};

export function AgentDetailPlaceholder({ message }: AgentDetailPlaceholderProps) {
  return (
    <div className="flex h-full min-h-[16rem] flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
