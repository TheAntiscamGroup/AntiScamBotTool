declare interface BulkDeleteKVResponse {
  success: boolean;
  result: {
    successful_key_count: number;
    unsuccessful_keys: string[]
  }
  // We don't really care about these types so they're just mocked
  messages: string[];
  error: string[];
}