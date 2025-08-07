import SpellSound, { SpellSoundLogLevel as LogLevel } from "./SpellSound";
import { ActionState } from "@highlite/plugin-api";
import { SoundManager } from "@highlite/plugin-api";

//// I like importing these so that there's a compile error if any
////  of these files are missing, so that I can fix it.

//// ==== Sound Effects below here ====
import sound_pickaxe1 from '../../resources/sounds/SpellSound/sfx/pickaxe1.mp3';
import sound_pickaxe2 from '../../resources/sounds/SpellSound/sfx/pickaxe2.mp3';
import sound_pickaxe3 from '../../resources/sounds/SpellSound/sfx/pickaxe3.mp3';
import sound_smelt1 from '../../resources/sounds/SpellSound/sfx/smelt1.mp3';
import sound_smelt2 from '../../resources/sounds/SpellSound/sfx/smelt2.mp3';
import sound_smelt3 from '../../resources/sounds/SpellSound/sfx/smelt3.mp3';
import sound_smith1 from '../../resources/sounds/SpellSound/sfx/smith1.mp3';
import sound_smith2 from '../../resources/sounds/SpellSound/sfx/smith2.mp3';
import sound_smith3 from '../../resources/sounds/SpellSound/sfx/smith3.mp3';
import sound_looting_around1 from '../../resources/sounds/SpellSound/sfx/carve1.mp3';
import sound_looting_around2 from '../../resources/sounds/SpellSound/sfx/carve2.mp3';
import sound_looting_around3 from '../../resources/sounds/SpellSound/sfx/carve3.mp3';
import sound_caughtstealing1 from '../../resources/sounds/SpellSound/sfx/caughtstealing1.mp3';
import sound_caughtstealing2 from '../../resources/sounds/SpellSound/sfx/caughtstealing2.mp3';
import sound_caughtstealing3 from '../../resources/sounds/SpellSound/sfx/caughtstealing3.mp3';
import sound_steal1 from '../../resources/sounds/SpellSound/sfx/steal1.mp3';
import sound_steal2 from '../../resources/sounds/SpellSound/sfx/steal2.mp3';
import sound_steal3 from '../../resources/sounds/SpellSound/sfx/steal3.mp3';

/**
 * A simple 3D vector class to represent positions in 3D space.
 * This is used to represent the position of sound effects in the game world.
 */
class Vector3d {
    public x: number;
    public y: number;
    public z: number;

    /**
     * Creates a new Vector3d instance.
     * 
     * @param x - The x coordinate of the vector.
     * @param y - The y coordinate of the vector.
     * @param z - The z coordinate of the vector.
     */
    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

/**
 * A simple enum to define the categories of sound effects ('pickaxe hit',
 * 'sword swing', etc.). This is used to categorize individual sound
 *  files into groups of the same effect, which can then be selected from
 *  randomly for each action
 */
enum SfxType {
    PickaxeHit,
    OreSmelted,
    MetalSmithed,
    LootingAround, // Sound when thieving but not yet looting an item
    CaughtStealing, // Sound when caught stealing (stunned)
    StealSuccessful, // Sound when successfully stealing an item
    // Add more sound effect types as needed
}

/**
 * This enum helps to define the sound effect type into even broader categories --
 *  is this an ambient sound, a non-critical sound (pickaxe hit, etc), a critical sound
 *  (initial pickaxe hit / tree finished chopping / inventory full)?
 */
enum SfxCategory {
    Ambient,         // Background sounds, not critical to gameplay. Brooks, bird chirps, eerie noise in caves, etc.
    NonCritical,     // Sounds that enhance gameplay but are not essential. Each tree chop, Each smelt, etc.
    Critical,        // Sounds that indicate important events or actions. Tree finished chopping, etc.
    UI               // Sounds related to user interface interactions.
}

/**
 * An interface that defines the parameters for a sound effect tag. This
 *  is used to create sound effect tags using named parameters in a JSON
 *  style format.
 */
interface SfxTagParams {
    type: SfxType;
    url: string;
}

/**
 * A class representing a sound effect and its associated metadata. This
 *  This groups the sound effect by category ('pickaxe hit', etc).
 */
class SfxTag {
    public type: SfxType;
    public url: string;

    constructor({
            type,
            url}
        : SfxTagParams
    ) {
        this.type = type;
        this.url = url;
    }
}

/**
 * An enum representing the source of a sound effect. This is used to
 *  categorize sound effects based on their origin, such as whether they
 *  are played by the player, an entity, the environment, or the user interface.
 */
enum SfxSourceType {
    Player,          // Sound effect is played by the player (e.g., pickaxe hit)
    Entity,         // Sound effect is played by an entity other than the player (e.g., monster roar)
    Environment,     // Sound effect is played by the environment (e.g., ambient sounds)
    UI,               // Sound effect is played by the user interface (e.g., button clicks)
}

interface SfxSourceParams {
    type: SfxSourceType;
    entityId?: string; // Optional, only for Entity type
    position?: Vector3d; // Optional, only for Entity and Environment types
}

/**
 * A class representing the source of a sound effect. This is used to
 *  categorize sound effects based on their origin, such as whether they
 *  are played by the player, an entity, the environment, or the user interface.
 * 
 * This class can also include additional information such as the entity ID
 *  (if applicable) and the position of the sound effect (if applicable).
 */
class SfxSource {
    public type: SfxSourceType;
    public entityId?: string; // Optional, only for Entity type
    public position?: { x: number; y: number; z: number }; // Optional, only for Entity and Environment types

    constructor({
            type,
            entityId,
            position}
        : SfxSourceParams
    ) {
        this.type = type;
        this.entityId = entityId;
        this.position = position;
    }
}

/**
 * An enhanced version of the ActionState enum that includes additional
 *  states which are useful for sound effects, such as "CrimeSuccess".
 * This is used to determine the current state of the player and play
 *  the appropriate sound effect.
 * 
 * Note: We can't extend the ActionState enum directly, so we create a new
 *  enum with the same values and add our own. It's not very DRY, but it'll do.
 */
enum PlayerEventType {
    Any = -1,
    IdleState = 0,
    MovingState = 1,
    MovingTowardTargetState = 2,
    BankingState = 3,
    MeleeCombatState = 4,
    TradingState = 5,
    ShoppingState = 6,
    FishingState = 7,
    CookingState = 8,
    RespawningState = 9,
    PlayerDeadState = 10,
    ConversationState = 11,
    ChangingAppearanceState = 12,
    WoodcuttingState = 13,
    MiningState = 14,
    HarvestingState = 15,
    TreeShakingState = 16,
    SmeltingState = 17,
    SmithingState = 18,
    CraftingState = 19,
    GoThroughDoorState = 20,
    MagicCombatState = 21,
    RangeCombatState = 22,
    EnchantingState = 23,
    TeleportingState = 24,
    NPCDeadState = 25,
    CreatingNonSkillItemsState = 26,
    SearchingWorldEntityState = 27,
    PotionMakingState = 28,
    MineThroughRocksState = 29,
    UsingSpinningWheelState = 30,
    ClimbSameMapLevelState = 31,
    SmeltingKilnState = 32,
    PlayerLoggingOutState = 33,
    PickpocketingState = 34,
    StunnedState = 35,
    PicklockingState = 36,
    NPCConversationState = 37,
    RubbingItemState = 38,
    OpeningItemState = 39,
    UsingItemOnEntityState = 40,
    DiggingState = 41,

    // Start at 100 to avoid conflicting with any hidden state we might not know about.
    CrimeSuccess = 100,
}

/**
 * An enhanced version of the ActionState enum that includes additional
 *  states which are useful for sound effects, such as "CrimeSuccess".
 * This is used to determine the current state of the player and play
 *  the appropriate sound effect.
 */
class PlayerEvent {
    public eventType : PlayerEventType;

    constructor(eventState : PlayerEventType) {
        this.eventType = eventState;
    }
}

/**
 * An interface that defines the parameters for a sound effect. This is
 *  used to create sound effects using named parameters in a JSON
 *  style format.
 */
interface SoundEffectParams {
    type: SfxType;
    moduleHandle: SpellSoundSfx;
    category: SfxCategory;
    source: SfxSource;
}

/**
 * A class representing a specific sound effect which is currently playing.
 */
class SoundEffect {
    public type: SfxType;
    public category: SfxCategory;
    public audioHandle: HTMLAudioElement;
    public source: SfxSource;

    /**
     * A handle to the sound effect module that this sound effect is
     * part of. This is used to access the module's methods.
     */
    private moduleHandle: SpellSoundSfx;

    constructor({
            type,
            moduleHandle,
            category,
            source,
        }: SoundEffectParams
    ) {
        this.type = type;
        this.moduleHandle = moduleHandle;
        this.category = category;
        this.source = source;

        // Try and find the URL from our tags. If it doesn't exist, then this
        //  is an error.
        var sfxMetadataTag = this.moduleHandle.findSoundEffectTagByType(type);
        if (!sfxMetadataTag) {
            throw new Error(`Sound effect type ${type} not found in module.`);
        }

        this.audioHandle = moduleHandle.getSoundManager().createAudioElement(sfxMetadataTag.url);        
    }

    play(): void {
        this.moduleHandle.logToPlugin(`\t--> Entering function ${this.play.name} with sound effect type ${SfxType[this.type]}.`);

        this.audioHandle.play().catch((error) => {
            this.moduleHandle.logToPlugin(`Error playing sound effect: ${error.message}`, LogLevel.Error);
        });

        this.moduleHandle.logToPlugin(`\t<-- Exiting function ${this.play.name}`);
    }
}

/**
 * The "sound effects" part of the SpellSound plugin. This class doesn't
 *  extend "plugin" as it's not a separate plugin; mainly a separate
 *  module for organization of the `SpellSound` plugin.
 */
export class SpellSoundSfx {
    /**
     * The base plugin that this Sfx module is part of. This is
     *  used to access the plugin's game hooks and state.
     */
    private basePlugin : SpellSound;

    /**
     * An array of all sound effect tags. This is used to store
     *  all sound effects that are available in the plugin.
     */
    private allSoundEffects: SfxTag[] = [];

    /**
     * An array of currently playing sound effects. This is used to
     *  keep track of sound effects that are currently playing, so that
     *  we can stop them when they are no longer needed.
     */
    private currentSoundEffects: SoundEffect[] = [];

    /**
     * The previously known state of the player. This is used to
     *  determine if the player has changed state since the last
     *  update, so that we can play the appropriate sound effect.
     */
    private lastPlayerState: PlayerEventType = PlayerEventType.Any;

    /**
     * The highlite sound manager, which is used to play sound effects.
     */
    private soundManager: SoundManager = new SoundManager();
    
    private lastCheckTimestamp : number = 0;

    constructor(basePlugin : SpellSound) {
        this.basePlugin = basePlugin;
    }

    // Ease of use function mapped to the main plugin's logger.
    logToPlugin(message: string, level: LogLevel = LogLevel.Debug): void {
        this.basePlugin.logToPlugin(message);
    }

    getSoundManager() : SoundManager {
        return this.soundManager;
    }

    findSoundEffectTagByType(type: SfxType): SfxTag | undefined {
        this.logToPlugin(`\t--> Entering function ${this.findSoundEffectTagByType.name} with sound effect type ${type}.`);

        var matchingEffects = this.allSoundEffects.filter((tag) => tag.type === type);
        if (!matchingEffects) {
            this.logToPlugin(`Sound effect type ${type} not found in module.`);
        }

        // Choose a random sound effect from our list of effects.
        var chosenSfx = matchingEffects.length > 0 ? matchingEffects[Math.floor(Math.random() * matchingEffects.length)] : undefined;
        if (!chosenSfx) {
            this.logToPlugin(`No sound effect found for type ${type}.`);
        }

        this.logToPlugin(`\t<-- Exiting function ${this.findSoundEffectTagByType.name} with sound effect type ${type}.`);
        return chosenSfx;
    }

    initSoundEffects() : void {
        this.logToPlugin(`\t--> Entering function ${this.initSoundEffects.name}`);

        this.allSoundEffects = [

            new SfxTag({
                type: SfxType.PickaxeHit,
                url: sound_pickaxe1
            }),
            new SfxTag({
                type: SfxType.PickaxeHit,
                url: sound_pickaxe2
            }),
            new SfxTag({
                type: SfxType.PickaxeHit,
                url: sound_pickaxe3
            }),


            new SfxTag({
                type: SfxType.OreSmelted,
                url: sound_smelt1
            }),
            new SfxTag({
                type: SfxType.OreSmelted,
                url: sound_smelt2
            }),
            new SfxTag({
                type: SfxType.OreSmelted,
                url: sound_smelt3
            }),


            new SfxTag({
                type: SfxType.MetalSmithed,
                url: sound_smith1
            }),
            new SfxTag({
                type: SfxType.MetalSmithed,
                url: sound_smith2
            }),
            new SfxTag({
                type: SfxType.MetalSmithed,
                url: sound_smith3
            }),


            new SfxTag({
                type: SfxType.LootingAround,
                url: sound_looting_around1
            }),
            new SfxTag({
                type: SfxType.LootingAround,
                url: sound_looting_around2
            }),
            new SfxTag({
                type: SfxType.LootingAround,
                url: sound_looting_around3
            }),


            new SfxTag({
                type: SfxType.CaughtStealing,
                url: sound_caughtstealing1
            }),
            new SfxTag({
                type: SfxType.CaughtStealing,
                url: sound_caughtstealing2
            }),
            new SfxTag({
                type: SfxType.CaughtStealing,
                url: sound_caughtstealing3
            }),

            new SfxTag({
                type: SfxType.StealSuccessful,
                url: sound_steal1
            }),
            new SfxTag({
                type: SfxType.StealSuccessful,
                url: sound_steal2
            }),
            new SfxTag({
                type: SfxType.StealSuccessful,
                url: sound_steal3
            }),
            // Add more sound effects as needed
        ];

        this.logToPlugin(`\t<-- Exiting function ${this.initSoundEffects.name}`);
    }

    /**
     * Initializes the plugin (called once on load).
     */
    init(): void {
        this.logToPlugin(`\t--> Entering function ${this.init.name}`);

        this.initSoundEffects();

        this.logToPlugin(`\t<-- Exiting function ${this.init.name}`);
    }

    getCurrentPlayerEvents() : PlayerEvent[] {
        const player = this.basePlugin.gameHooks.EntityManager.Instance.MainPlayer;
        if (!player) return [];

        var currentState = player._currentState.getCurrentState();
        var events: PlayerEvent[] = [];

        // Add extending states here.

        if (this.lastPlayerState == PlayerEventType.PickpocketingState &&
                currentState != PlayerEventType.PickpocketingState &&
                currentState != PlayerEventType.StunnedState
        ) {
            // If we're no longer pickpocketing, and we didn't get stunned,
            //  and we were pickpocketing before, then we must have
            //  succeeded at a crime.
            events.push(new PlayerEvent(PlayerEventType.CrimeSuccess));
        }
        
        // Map ActionState to PlayerEvent. We will eventually have more than one event
        //  happening at once (e.g. "CombatStart" state -- multiple NPCs may be attacking)
        switch (currentState) {
            case ActionState.IdleState:
                events.push(new PlayerEvent(PlayerEventType.IdleState));
                break;
            case ActionState.MovingState:
                events.push(new PlayerEvent(PlayerEventType.MovingState));
                break;
            case ActionState.MiningState:
                events.push(new PlayerEvent(PlayerEventType.MiningState));
                break;
            case ActionState.SmeltingState:
                events.push(new PlayerEvent(PlayerEventType.SmeltingState));
                break;
            case ActionState.SmithingState:
                events.push(new PlayerEvent(PlayerEventType.SmithingState));
                break;
            case ActionState.PickpocketingState:
                events.push(new PlayerEvent(PlayerEventType.PickpocketingState));
                break;
            case ActionState.StunnedState:
                events.push(new PlayerEvent(PlayerEventType.StunnedState));
                break;
            // Add more mappings as needed
            default:
                events.push(new PlayerEvent(PlayerEventType.Any));
                break;
        }

        return events;
    }

    GameLoop_update(): void {
        const player = this.basePlugin.gameHooks.EntityManager.Instance.MainPlayer;
        if (!player ||
            !player?.CurrentGamePosition
        ) return;

        var currentTimestamp = Date.now();
        if (currentTimestamp - this.lastCheckTimestamp < 1500) {
            // Only check every 500ms to avoid excessive checks
            return;
        }

        this.lastCheckTimestamp = currentTimestamp;

        var currentEvents = this.getCurrentPlayerEvents();

        this.ProcessPlayerEvents(player, currentEvents);
    }

    ProcessPlayerEvents(player, events: PlayerEvent[]) {
        this.logToPlugin(`\t--> Entering function ${this.ProcessPlayerEvents.name} with events: ${events.map(e => e.eventType).join(", ")}`);

        for (let event of events) {
            this.logToPlugin(`\t--> Processing state "${PlayerEventType[event.eventType]}"`);

            // Mining
            if (event.eventType == PlayerEventType.MiningState) {
                // The source of the sound effect.
                let sfxSource = new SfxSource({
                    type: SfxSourceType.Player,
                    position: new Vector3d(player.CurrentGamePosition.x, player.CurrentGamePosition.y, player.CurrentGamePosition.z)
                });

                new SoundEffect({
                    type: SfxType.PickaxeHit,
                    moduleHandle: this,
                    category: SfxCategory.NonCritical,
                    source: sfxSource
                }).play();
            }

            // Smelting
            else if (event.eventType == PlayerEventType.SmeltingState) {
                // The source of the sound effect.
                let sfxSource = new SfxSource({
                    type: SfxSourceType.Player,
                    position: new Vector3d(player.CurrentGamePosition.x, player.CurrentGamePosition.y, player.CurrentGamePosition.z)
                });

                new SoundEffect({
                    type: SfxType.OreSmelted,
                    moduleHandle: this,
                    category: SfxCategory.NonCritical,
                    source: sfxSource
                }).play();
            }
            
            // Smithing
            else if (event.eventType == PlayerEventType.SmithingState) {
                // The source of the sound effect.
                let sfxSource = new SfxSource({
                    type: SfxSourceType.Player,
                    position: new Vector3d(player.CurrentGamePosition.x, player.CurrentGamePosition.y, player.CurrentGamePosition.z)
                });

                new SoundEffect({
                    type: SfxType.MetalSmithed,
                    moduleHandle: this,
                    category: SfxCategory.NonCritical,
                    source: sfxSource
                }).play();
            }

            // Looting around
            else if (event.eventType == PlayerEventType.PickpocketingState) {
                // The source of the sound effect.
                let sfxSource = new SfxSource({
                    type: SfxSourceType.Player,
                    position: new Vector3d(player.CurrentGamePosition.x, player.CurrentGamePosition.y, player.CurrentGamePosition.z)
                });

                new SoundEffect({
                    type: SfxType.LootingAround,
                    moduleHandle: this,
                    category: SfxCategory.NonCritical,
                    source: sfxSource
                }).play();
            }

            // Caught stealing
            else if (event.eventType == PlayerEventType.StunnedState) {
                // The source of the sound effect.
                let sfxSource = new SfxSource({
                    type: SfxSourceType.Player,
                    position: new Vector3d(player.CurrentGamePosition.x, player.CurrentGamePosition.y, player.CurrentGamePosition.z)
                });

                new SoundEffect({
                    type: SfxType.CaughtStealing,
                    moduleHandle: this,
                    category: SfxCategory.Critical,
                    source: sfxSource
                }).play();
            }

            // Crime Success
            else if (event.eventType == PlayerEventType.CrimeSuccess) {
                // The source of the sound effect.
                let sfxSource = new SfxSource({
                    type: SfxSourceType.Player,
                    position: new Vector3d(player.CurrentGamePosition.x, player.CurrentGamePosition.y, player.CurrentGamePosition.z)
                });

                new SoundEffect({
                    type: SfxType.StealSuccessful,
                    moduleHandle: this,
                    category: SfxCategory.NonCritical,
                    source: sfxSource
                }).play();
            }

            this.logToPlugin(`\t<-- Exiting function ${this.ProcessPlayerEvents.name} with event state: ${event.eventType}`);
        }

        // Update the last known player state to the most recent event's state.
        if (events.length > 0) {
            this.lastPlayerState = events[events.length - 1].eventType;
        } else {
            this.lastPlayerState = PlayerEventType.Any;
        }
    }
}