import SpellSound, { SpellSoundLogLevel as LogLevel } from "./SpellSound";
import { ActionState } from "@highlite/plugin-api";
import { SoundManager } from "@highlite/plugin-api";

//// I like importing these so that there's a compile error if any
////  of these files are missing, so that I can fix it.

//// ==== Sound Effects below here ====
import sound_pickaxe1 from '../../resources/sounds/SpellSound/sounds/pickaxe1.mp3';
import sound_pickaxe2 from '../../resources/sounds/SpellSound/sounds/pickaxe2.mp3';
import sound_pickaxe3 from '../../resources/sounds/SpellSound/sounds/pickaxe3.mp3';
import sound_smelt1 from '../../resources/sounds/SpellSound/sounds/smelt1.mp3';
import sound_smelt2 from '../../resources/sounds/SpellSound/sounds/smelt2.mp3';
import sound_smelt3 from '../../resources/sounds/SpellSound/sounds/smelt3.mp3';
import sound_smith1 from '../../resources/sounds/SpellSound/sounds/smith1.mp3';
import sound_smith2 from '../../resources/sounds/SpellSound/sounds/smith2.mp3';
import sound_smith3 from '../../resources/sounds/SpellSound/sounds/smith3.mp3';
import sound_looting_around1 from '../../resources/sounds/SpellSound/sounds/looting_around1.wav';
import sound_looting_around2 from '../../resources/sounds/SpellSound/sounds/looting_around2.wav';
import sound_looting_around3 from '../../resources/sounds/SpellSound/sounds/looting_around3.wav';
import sound_caughtstealing1 from '../../resources/sounds/SpellSound/sounds/caughtstealing1.mp3';
import sound_caughtstealing2 from '../../resources/sounds/SpellSound/sounds/caughtstealing2.mp3';
import sound_caughtstealing3 from '../../resources/sounds/SpellSound/sounds/caughtstealing3.mp3';

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
    private lastPlayerState: ActionState = ActionState.Any;

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

        const currentState = player._currentState.getCurrentState();
        
        // Mining
        if (currentState == ActionState.MiningState) {
            this.logToPlugin(`\t--> Entering function ${this.GameLoop_update.name} with current state: ${ActionState[currentState]}`);

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

            this.logToPlugin(`\t<-- Exiting function ${this.GameLoop_update.name}`);
        }

        // Smelting
        else if (currentState == ActionState.SmeltingState) {
            this.logToPlugin(`\t--> Entering function ${this.GameLoop_update.name} with current state: ${ActionState[currentState]}`);

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

            this.logToPlugin(`\t<-- Exiting function ${this.GameLoop_update.name}`);
        }
        
        // Smithing
        else if (currentState == ActionState.SmithingState) {
            this.logToPlugin(`\t--> Entering function ${this.GameLoop_update.name} with current state: ${ActionState[currentState]}`);

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

            this.logToPlugin(`\t<-- Exiting function ${this.GameLoop_update.name}`);
        }

        // Looting around
        else if (currentState == ActionState.PickpocketingState) {
            this.logToPlugin(`\t--> Entering function ${this.GameLoop_update.name} with current state: ${ActionState[currentState]}`);

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

            this.logToPlugin(`\t<-- Exiting function ${this.GameLoop_update.name}`);
        }

        // Caught stealing
        else if (currentState == ActionState.StunnedState) {
            this.logToPlugin(`\t--> Entering function ${this.GameLoop_update.name} with current state: ${ActionState[currentState]}`);

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

            this.logToPlugin(`\t<-- Exiting function ${this.GameLoop_update.name}`);
        }
    }
}