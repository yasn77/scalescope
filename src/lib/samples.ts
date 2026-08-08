export interface SamplePolicy {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const SAMPLES: SamplePolicy[] = [
  {
    id: "allow-all",
    name: "Allow all (default)",
    description: "The default tailnet policy — all devices can reach all others.",
    content: `{
  "acls": [
    {
      "action": "accept",
      "src": ["*"],
      "dst": ["*:*"]
    }
  ],
  "ssh": [
    {
      "action": "check",
      "src": ["autogroup:member"],
      "dst": ["autogroup:self"],
      "users": ["autogroup:nonroot", "root"]
    }
  ]
}`,
  },
  {
    id: "deny-all",
    name: "Deny all",
    description: "Deny all connections — nothing in the tailnet will work.",
    content: `{
  "acls": []
}`,
  },
  {
    id: "own-devices",
    name: "Users access own devices",
    description: "All users can access devices they own.",
    content: `{
  "acls": [
    {
      "action": "accept",
      "src": ["autogroup:member"],
      "dst": ["autogroup:self:*"]
    }
  ]
}`,
  },
  {
    id: "tags",
    name: "Tag-based access",
    description: "Frontend → backend → logging flow using tags.",
    content: `{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:frontend"],
      "dst": ["tag:backend:*"]
    },
    {
      "action": "accept",
      "src": ["tag:backend"],
      "dst": ["tag:logging:*"]
    }
  ]
}`,
  },
  {
    id: "groups",
    name: "Group-based access",
    description: "Engineering and DevOps groups access tagged resources.",
    content: `{
  "groups": {
    "group:engineering": ["alice@example.com", "bob@example.com"],
    "group:devops": ["carl@example.com", "dave@example.com"]
  },
  "acls": [
    {
      "action": "accept",
      "src": ["group:engineering"],
      "dst": ["tag:frontend:*", "tag:backend:*"]
    },
    {
      "action": "accept",
      "src": ["group:devops"],
      "dst": ["tag:frontend:*", "tag:backend:*", "tag:logging:*"]
    }
  ],
  "tagOwners": {
    "tag:frontend": ["autogroup:admin"],
    "tag:backend": ["autogroup:admin"],
    "tag:logging": ["autogroup:admin"]
  }
}`,
  },
  {
    id: "standard-plan",
    name: "Standard plan ACL",
    description: "Employees access own + corp devices; admins access prod.",
    content: `{
  "acls": [
    { "action": "accept", "src": ["autogroup:member"], "dst": ["autogroup:self:*"] },
    { "action": "accept", "src": ["autogroup:member"], "dst": ["tag:corp:*"] },
    { "action": "accept", "src": ["autogroup:admin"], "dst": ["tag:prod:*"] }
  ],
  "tagOwners": {
    "tag:corp": ["autogroup:admin"],
    "tag:prod": ["autogroup:admin"]
  }
}`,
  },
  {
    id: "vpc-peering",
    name: "VPC access (peering)",
    description: "Dev team accesses VPC subnets; subnets peer to each other.",
    content: `{
  "groups": {
    "group:dev": ["alice@example.com", "bob@example.com"]
  },
  "acls": [
    { "action": "accept", "src": ["autogroup:admin"], "dst": ["tag:vpc-peering:*"] },
    {
      "action": "accept",
      "src": ["group:dev", "192.0.2.0/24", "198.51.100.0/24"],
      "dst": ["192.0.2.0/24:*", "198.51.100.0/24:*"]
    }
  ],
  "tagOwners": {
    "tag:vpc-peering": ["autogroup:admin"]
  },
  "autoApprovers": {
    "routes": {
      "192.0.2.0/24": ["tag:vpc-peering", "autogroup:admin"],
      "198.51.100.0/24": ["tag:vpc-peering", "autogroup:admin"]
    }
  }
}`,
  },
  {
    id: "microsegmentation",
    name: "Network microsegmentation",
    description: "Isolated segments with tests ensuring no cross-access.",
    content: `{
  "groups": {
    "group:support": ["alice@example.com", "bob@example.com"]
  },
  "acls": [
    {
      "action": "accept",
      "src": ["group:support"],
      "dst": ["tag:segment-abc:443", "tag:segment-xyz:443"]
    },
    {
      "action": "accept",
      "src": ["tag:support"],
      "dst": ["tag:segment-abc:443", "tag:segment-xyz:443"]
    }
  ],
  "tests": [
    { "src": "group:support", "accept": ["tag:segment-abc:443", "tag:segment-xyz:443"] },
    { "src": "tag:support", "accept": ["tag:segment-abc:443", "tag:segment-xyz:443"] },
    { "src": "tag:segment-abc", "deny": ["tag:segment-xyz:443"] },
    { "src": "tag:segment-xyz", "deny": ["tag:segment-abc:443"] }
  ],
  "tagOwners": {
    "tag:support": ["autogroup:admin"]
  }
}`,
  },
  {
    id: "monitoring",
    name: "Monitoring access",
    description: "Monitoring server accesses all apps on common ports.",
    content: `{
  "groups": {
    "group:devops": ["carl@example.com"]
  },
  "acls": [
    {
      "action": "accept",
      "src": ["tag:monitoring"],
      "dst": ["*:80,443,9100", "tag:logging:*"]
    },
    {
      "action": "accept",
      "src": ["group:devops"],
      "dst": ["tag:monitoring:*", "tag:logging:*"]
    }
  ],
  "tagOwners": {
    "tag:monitoring": ["group:devops"],
    "tag:logging": ["group:devops"]
  }
}`,
  },
  {
    id: "grants",
    name: "Grants (modern)",
    description: "Modern grants syntax with ip capabilities.",
    content: `{
  "grants": [
    {
      "src": ["group:engineering"],
      "dst": ["tag:webserver"],
      "ip": ["tcp:443", "tcp:80"]
    },
    {
      "src": ["tag:monitoring"],
      "dst": ["*"],
      "ip": ["tcp:80", "tcp:443", "tcp:9100"]
    }
  ],
  "groups": {
    "group:engineering": ["alice@example.com", "bob@example.com"]
  },
  "tagOwners": {
    "tag:webserver": ["autogroup:admin"]
  }
}`,
  },
];
