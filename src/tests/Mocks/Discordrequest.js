export const mockDiscordRequest = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({}),
});

export const mockInstallGlobalCommands = jest.fn().mockResolvedValue(undefined);