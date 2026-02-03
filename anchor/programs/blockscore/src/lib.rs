use anchor_lang::prelude::*;

declare_id!("976oFeJkbiqY6r7V24TvkFwfdcy2mJyJLK9ueVfaQRUe");

#[program]
pub mod blockscore {
    use super::*;

    /// Initialize the program with an authority who can update scores
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.total_scores = 0;
        config.bump = ctx.bumps.config;

        emit!(ProgramInitialized {
            authority: config.authority,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("BlockScore program initialized with authority: {}", config.authority);
        Ok(())
    }

    /// Record or update a wallet's reputation score (authority only)
    pub fn record_score(
        ctx: Context<RecordScore>,
        score: u16,        // 0-1000 representing 0.0-100.0
        grade: String,     // A+, A, B+, B, C, D, F
        metadata: String,  // Optional JSON metadata
    ) -> Result<()> {
        require!(score <= 1000, BlockScoreError::ScoreOutOfRange);
        require!(grade.len() <= 3, BlockScoreError::GradeTooLong);
        require!(metadata.len() <= 256, BlockScoreError::MetadataTooLong);

        let score_account = &mut ctx.accounts.score_account;
        let config = &mut ctx.accounts.config;
        let clock = Clock::get()?;

        let is_new = score_account.wallet == Pubkey::default();
        
        // Store previous values for event
        let previous_score = if is_new { None } else { Some(score_account.score) };

        // Update score account
        score_account.wallet = ctx.accounts.wallet.key();
        score_account.score = score;
        score_account.grade = grade.clone();
        score_account.metadata = metadata.clone();
        score_account.last_updated = clock.unix_timestamp;
        score_account.update_count += 1;
        score_account.bump = ctx.bumps.score_account;

        // Update config stats
        if is_new {
            config.total_scores += 1;
        }

        emit!(ScoreRecorded {
            wallet: ctx.accounts.wallet.key(),
            score,
            grade,
            previous_score,
            timestamp: clock.unix_timestamp,
            update_count: score_account.update_count,
        });

        msg!(
            "Score recorded for {}: {} (grade: {})",
            ctx.accounts.wallet.key(),
            score,
            score_account.grade
        );

        Ok(())
    }

    /// Transfer authority to a new account
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let old_authority = config.authority;
        config.authority = new_authority;

        emit!(AuthorityTransferred {
            old_authority,
            new_authority,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Authority transferred from {} to {}", old_authority, new_authority);
        Ok(())
    }

    /// Add an authorized agent who can also update scores
    pub fn add_agent(ctx: Context<AddAgent>) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.authority = ctx.accounts.config.authority;
        agent.agent = ctx.accounts.new_agent.key();
        agent.is_active = true;
        agent.created_at = Clock::get()?.unix_timestamp;
        agent.bump = ctx.bumps.agent;

        emit!(AgentAdded {
            agent: agent.agent,
            added_by: ctx.accounts.authority.key(),
            timestamp: agent.created_at,
        });

        msg!("Agent {} added", agent.agent);
        Ok(())
    }

    /// Deactivate an agent
    pub fn remove_agent(ctx: Context<RemoveAgent>) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.is_active = false;

        emit!(AgentRemoved {
            agent: agent.agent,
            removed_by: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Agent {} deactivated", agent.agent);
        Ok(())
    }
}

// ============================================================================
// Account Structures
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct ProgramConfig {
    /// The authority who can update scores and manage agents
    pub authority: Pubkey,
    /// Total number of wallets scored
    pub total_scores: u64,
    /// Bump seed for PDA
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ScoreAccount {
    /// The wallet being scored
    pub wallet: Pubkey,
    /// Reputation score (0-1000, representing 0.0-100.0)
    pub score: u16,
    /// Letter grade (A+, A, B+, B, C, D, F)
    #[max_len(3)]
    pub grade: String,
    /// Optional metadata (JSON string)
    #[max_len(256)]
    pub metadata: String,
    /// Unix timestamp of last update
    pub last_updated: i64,
    /// Number of times this score has been updated
    pub update_count: u32,
    /// Bump seed for PDA
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AgentAccount {
    /// The main program authority
    pub authority: Pubkey,
    /// The agent's pubkey
    pub agent: Pubkey,
    /// Whether this agent is currently active
    pub is_active: bool,
    /// When the agent was added
    pub created_at: i64,
    /// Bump seed for PDA
    pub bump: u8,
}

// ============================================================================
// Instruction Contexts
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProgramConfig::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordScore<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.authority == authority.key() || is_valid_agent(&agent, &authority.key()) @ BlockScoreError::Unauthorized
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + ScoreAccount::INIT_SPACE,
        seeds = [b"score", wallet.key().as_ref()],
        bump
    )]
    pub score_account: Account<'info, ScoreAccount>,

    /// The wallet whose score is being recorded
    /// CHECK: This is just a pubkey reference, no data read
    pub wallet: UncheckedAccount<'info>,

    /// Optional agent account for delegated authority
    /// CHECK: Validated in constraint
    pub agent: Option<Account<'info, AgentAccount>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.authority == authority.key() @ BlockScoreError::Unauthorized
    )]
    pub config: Account<'info, ProgramConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddAgent<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.authority == authority.key() @ BlockScoreError::Unauthorized
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + AgentAccount::INIT_SPACE,
        seeds = [b"agent", new_agent.key().as_ref()],
        bump
    )]
    pub agent: Account<'info, AgentAccount>,

    /// CHECK: This is the new agent's pubkey
    pub new_agent: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveAgent<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.authority == authority.key() @ BlockScoreError::Unauthorized
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(
        mut,
        seeds = [b"agent", agent.agent.as_ref()],
        bump = agent.bump
    )]
    pub agent: Account<'info, AgentAccount>,

    pub authority: Signer<'info>,
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct ProgramInitialized {
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ScoreRecorded {
    pub wallet: Pubkey,
    pub score: u16,
    pub grade: String,
    pub previous_score: Option<u16>,
    pub timestamp: i64,
    pub update_count: u32,
}

#[event]
pub struct AuthorityTransferred {
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AgentAdded {
    pub agent: Pubkey,
    pub added_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AgentRemoved {
    pub agent: Pubkey,
    pub removed_by: Pubkey,
    pub timestamp: i64,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum BlockScoreError {
    #[msg("Score must be between 0 and 1000")]
    ScoreOutOfRange,
    #[msg("Grade must be 3 characters or less")]
    GradeTooLong,
    #[msg("Metadata must be 256 characters or less")]
    MetadataTooLong,
    #[msg("Unauthorized: only authority or active agents can perform this action")]
    Unauthorized,
    #[msg("Agent is not active")]
    AgentNotActive,
}

// ============================================================================
// Helper Functions
// ============================================================================

fn is_valid_agent(agent: &Option<Account<AgentAccount>>, signer: &Pubkey) -> bool {
    match agent {
        Some(agent_account) => agent_account.agent == *signer && agent_account.is_active,
        None => false,
    }
}
