export type ChatIntent =
  | 'conversation'
  | 'minecraft_build_request'
  | 'blueprint_modification'
  | 'minecraft_question'
  | 'app_question';

export interface BlueprintDimensions {
  width: number;
  length: number;
  height: number;
}

export interface BlueprintMaterial {
  label: string;
  count: number;
}

export interface BlueprintLayer {
  name: string;
  description: string;
  yLevel?: number;
  materials?: BlueprintMaterial[];
  instructions?: string[];
}

export interface BlueprintSection {
  name: string;
  description: string;
  estimatedTime: string;
  status: 'pending' | 'in_progress' | 'complete';
  layers: BlueprintLayer[];
}

export interface GeneratedBlueprintImages {
  status: 'ready';
  views: Partial<Record<string, string>>;
  sectionDiagrams: Array<{ name: string; imageUrl: string }>;
}

export interface BlueprintResponse {
  type: 'blueprint';
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: string;
  estimatedBlocks: number;
  dimensions: BlueprintDimensions;
  style?: string;
  biomeRecommendation?: string;
  materials: BlueprintMaterial[];
  sections: BlueprintSection[];
}

export interface ConversationResponse {
  type: 'conversation';
  message: string;
}

export type ChatResponse = ConversationResponse | (BlueprintResponse & { projectId?: string; conversationId?: string; blueprintId?: string });
