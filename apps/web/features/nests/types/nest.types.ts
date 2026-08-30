export type Nest = {
  id: string;
  slug: string;
  title: string;
  description: string;
  creatorId: string;
  createdAt: string;
  memberCount: number;
  postCount: number;
};

export type MembershipState = {
  joined: boolean;
};

export type CreateNestInput = {
  slug: string;
  title: string;
  description: string;
};
