import SpellSound from "./SpellSound";
import { SpellSoundLogLevel as LogLevel } from "./SpellSound";
import { SpellSoundLogSource as LogSource } from "./SpellSound";

import { ActionState } from "@highlite/plugin-api";
import { SoundManager } from "@highlite/plugin-api";
import { Item } from "@highlite/plugin-api";

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
import sound_ore_depleted1 from '../../resources/sounds/SpellSound/sfx/ore_depleted1.mp3';
import sound_ore_depleted2 from '../../resources/sounds/SpellSound/sfx/ore_depleted2.mp3';
import sound_ore_depleted3 from '../../resources/sounds/SpellSound/sfx/ore_depleted3.mp3';
import sound_fishing1 from '../../resources/sounds/SpellSound/sfx/fishing1.mp3';
import sound_fishing2 from '../../resources/sounds/SpellSound/sfx/fishing2.mp3';
import sound_fishing3 from '../../resources/sounds/SpellSound/sfx/fishing3.mp3';
import sound_fish_caught1 from '../../resources/sounds/SpellSound/sfx/fish_caught1.mp3';
import sound_fish_caught2 from '../../resources/sounds/SpellSound/sfx/fish_caught2.mp3';
import sound_fish_caught3 from '../../resources/sounds/SpellSound/sfx/fish_caught3.mp3';
import sound_full_inventory from '../../resources/sounds/SpellSound/sfx/full_inventory.mp3';
import sound_chop1 from '../../resources/sounds/SpellSound/sfx/chop1.mp3';
import sound_chop2 from '../../resources/sounds/SpellSound/sfx/chop2.mp3';
import sound_chop3 from '../../resources/sounds/SpellSound/sfx/chop3.mp3';
import sound_log_received1 from '../../resources/sounds/SpellSound/sfx/log_received1.mp3';
import sound_log_received2 from '../../resources/sounds/SpellSound/sfx/log_received2.mp3';
import sound_log_received3 from '../../resources/sounds/SpellSound/sfx/log_received3.mp3';
import sound_cook1 from '../../resources/sounds/SpellSound/sfx/cook1.mp3';
import sound_cook2 from '../../resources/sounds/SpellSound/sfx/cook2.mp3';
import sound_cook3 from '../../resources/sounds/SpellSound/sfx/cook3.mp3';
import sound_burn from '../../resources/sounds/SpellSound/sfx/burn.mp3';

/**
 * An enum representing the IDs of various items in the game. This is so that
 *  we have a centralized place to find which item IDs correspond to what item.
 * There's not currently a great API in highlite to get item IDs, so this
 *  is a workaround.
 */
enum ItemIds {
    BurntFood = 325,
}

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
    OreDepleted, // Sound when a rock is depleted after mining
    FishingInProgress, // Sound when fishing but not yet catching a fish
    FishCaught, // Sound when catching a fish
    FullInventory,
    WoodcutInProgress,
    WoodcutLogsReceived, // Sound when receiving logs from chopping a tree
    WoodcutTreeFelled,
    CookingSuccess,
    CookingFailure,
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
    OreDepleted = 101, // When a rock is depleted after mining
    FishingInProgress = 102, // When fishing but not yet catching a fish
    FishCaught = 103, // When catching a fish
    FullInventory = 104,
    WoodcutInProgress = 105, // When chopping a tree but not receiving any logs this tick
    WoodcutLogsReceived = 106, // When receiving logs from chopping a tree
    WoodcutTreeFelled = 107, // When a tree is fully chopped and logs are received
    CookingInProgress = 108, // When cooking but not yet finished cooking
    CookingSuccess = 109, // When food is successfully cooked
    CookingFailure = 110, // When food is burned
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
            source,}    
        : SoundEffectParams
    ) {
        this.type = type;
        this.moduleHandle = moduleHandle;
        this.category = category;
        this.source = source;

        // Try and find the URL from our tags. If it doesn't exist, then this
        //  is an error.
        var sfxMetadataTag = this.moduleHandle.findSoundEffectTagByType(type);
        if (!sfxMetadataTag) {
            throw new Error(`Sound effect type '${SfxType[type]}' not found in module.`);
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

interface EasyItemParams {
    id: number;
    amount: number;
    isIOU?: boolean; // Optional, defaults to false
    isNull?: boolean; // Optional, defaults to false
    // isNull is used to indicate that this item is a null item (i.e. no item in this slot)
}

/**
 * A simple class to represent an item in the player's inventory.
 *  This is supposed to simplify interacting with the Item game
 *  hook/interface.
 */
class EasyItem {
    public id: number;
    public amount: number;
    public isIOU: boolean;
    public isNull: boolean;

    constructor({
            id,
            amount,
            isIOU,
            isNull,}
        : EasyItemParams
    ) {
        this.id = id;
        this.amount = amount;
        this.isIOU = isIOU ?? false;
        this.isNull = isNull ?? false;
    }

    /**
     * Compares this EasyItem to another EasyItem for equality.
     *
     * @param other - The other EasyItem to compare to.
     * @returns True if the items are equal, false otherwise.
     */
    isEqual(other: EasyItem): boolean {
        return this.id === other.id &&
                this.amount === other.amount &&
                this.isIOU === other.isIOU &&
                this.isNull === other.isNull;
    }

    toString(): string {
        return `Item ID: ${this.id}, Amount: ${this.amount}, Is IOU: ${this.isIOU}`;
    }
}

interface InventoryChangedEvent {
    previousItems: Array<EasyItem>;
    currentItems: Array<EasyItem>;
}

/**
 * A class that handles keeping track of the main player's inventory. This is different from
 *  the "InventoryManager" gameHook, but closely interacts with it, and is designed to be an
 *  easier way to interact with the data from said hook.
 */
class InventoryManager {
    private previousItems : Array<EasyItem>;
    private currentItems : Array<EasyItem>;
    private moduleHandle : SpellSoundSfx;

    /**
     * A queue of inventory events that have occurred since the last poll.
     */
    private eventQueue : Array<InventoryChangedEvent>;

    public EventQueue() : Array<InventoryChangedEvent> {
        return this.eventQueue;
    }

    constructor(moduleHandle: SpellSoundSfx) {
        this.previousItems = [];
        this.currentItems = [];
        this.moduleHandle = moduleHandle;
        this.eventQueue = [];
    }

    /**
     * Converts an array of (Item | null) objects to an array of EasyItem objects.
     * This is useful for simplifying the interaction with the inventory items.
     * 
     * @param items - An array of Item objects or null values.
     * @returns An array of EasyItem objects.
     */
    ezItemsArrayFromItems(items: Array<Item | null>): EasyItem[] {
        return items.map(item => {
            let ezItem : EasyItem;

            if (!item || item === undefined) {
                // Handle null items gracefully
                ezItem = new EasyItem({ id: 0, amount: 0, isNull: true});
            }
            else {
                ezItem = new EasyItem({ id: item.Id, amount: item.Amount, isIOU: item.IsIOU });
            }

            return ezItem;
        });
    }
    
    /**
     * Polls the player's inventory for changes. If any changes are detected,
     *  they are added to the event queue. This function should be called
     *  regularly (e.g., in the game loop) to keep track of inventory changes.
     */
    pollForInventoryEvents() {
        this.moduleHandle.logToPlugin(`\t--> Entering function ${this.pollForInventoryEvents.name}`);

        const player = document.highlite.gameHooks.EntityManager.Instance.MainPlayer;
        if (!player || !player.Inventory) {
            return;
        }

        // Temporally coupled -- clear the previous frame's event queue before
        //  adding anything to it.
        this.eventQueue = [];

        this.currentItems = this.ezItemsArrayFromItems(player.Inventory.Items);
        var isInventoryTheSame = this.previousItems.every((item, index) => item?.isEqual(this.currentItems[index]));

        if (!isInventoryTheSame) {
            this.eventQueue.push({
                previousItems: [...this.previousItems],
                currentItems: [...this.currentItems]
            });

            // Log the inventory change
            this.moduleHandle.logToPlugin(`Inventory changed: ${this.previousItems.map(item => item.toString()).join(", ")} -> ${this.currentItems.map(item => item.toString()).join(", ")}`, LogLevel.Debug);
        }

        // Update previous items for the next poll
        this.previousItems = [...this.currentItems];

        this.moduleHandle.logToPlugin(`\t<-- Exiting function ${this.pollForInventoryEvents.name}`);
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
    private lastPlayerStates: PlayerEventType[] = [ PlayerEventType.Any ];

    /**
     * The highlite sound manager, which is used to play sound effects.
     */
    private soundManager: SoundManager = new SoundManager();
    
    private lastCheckTimestamp : number = 0;

    /**
     * A handle to our custom inventory manager, which is used to keep
     *  track of the player's inventory.
     */
    private inventoryManager : InventoryManager;

    constructor(basePlugin : SpellSound) {
        this.basePlugin = basePlugin;
        this.inventoryManager = new InventoryManager(this);
    }

    // Ease of use function mapped to the main plugin's logger.
    logToPlugin(message: string, level: LogLevel = LogLevel.Debug): void {
        this.basePlugin.logToPlugin(message, level, LogSource.Sfx);
    }

    getSoundManager() : SoundManager {
        return this.soundManager;
    }

    findSoundEffectTagByType(type: SfxType): SfxTag | undefined {
        this.logToPlugin(`\t--> Entering function ${this.findSoundEffectTagByType.name} with sound effect type ${type}.`);

        var matchingEffects = this.allSoundEffects.filter((tag) => tag.type === type);
        if (!matchingEffects) {
            this.logToPlugin(`Sound effect type '${SfxType[type]}' not found in module.`);
        }

        // Choose a random sound effect from our list of effects.
        var chosenSfx = matchingEffects.length > 0 ? matchingEffects[Math.floor(Math.random() * matchingEffects.length)] : undefined;
        if (!chosenSfx) {
            this.logToPlugin(`No sound effect found for type '${type}'.`);
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
                type: SfxType.OreDepleted,
                url: sound_ore_depleted1
            }),
            new SfxTag({
                type: SfxType.OreDepleted,
                url: sound_ore_depleted2
            }),
            new SfxTag({
                type: SfxType.OreDepleted,
                url: sound_ore_depleted3
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


            new SfxTag({
                type: SfxType.FishingInProgress,
                url: sound_fishing1
            }),
            new SfxTag({
                type: SfxType.FishingInProgress,
                url: sound_fishing2
            }),
            new SfxTag({
                type: SfxType.FishingInProgress,
                url: sound_fishing3
            }),


            new SfxTag({
                type: SfxType.FishCaught,
                url: sound_fish_caught1
            }),
            new SfxTag({
                type: SfxType.FishCaught,
                url: sound_fish_caught2
            }),
            new SfxTag({
                type: SfxType.FishCaught,
                url: sound_fish_caught3
            }),

            
            new SfxTag({
                type: SfxType.FullInventory,
                url: sound_full_inventory
            }),


            new SfxTag({
                type: SfxType.WoodcutInProgress,
                url: sound_chop1
            }),
            new SfxTag({
                type: SfxType.WoodcutInProgress,
                url: sound_chop2
            }),
            new SfxTag({
                type: SfxType.WoodcutInProgress,
                url: sound_chop3
            }),


            new SfxTag({
                type: SfxType.WoodcutLogsReceived,
                url: sound_log_received1
            }),
            new SfxTag({
                type: SfxType.WoodcutLogsReceived,
                url: sound_log_received2
            }),
            new SfxTag({
                type: SfxType.WoodcutLogsReceived,
                url: sound_log_received3
            }),


            new SfxTag({
                type: SfxType.CookingSuccess,
                url: sound_cook1
            }),
            new SfxTag({
                type: SfxType.CookingSuccess,
                url: sound_cook2
            }),
            new SfxTag({
                type: SfxType.CookingSuccess,
                url: sound_cook3
            }),


            new SfxTag({
                type: SfxType.CookingFailure,
                url: sound_burn
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

    /**
     * Adds our custom action states for "Cooking", if necessary, if the player
     *  is currently cooking.
     */
    addExtendedActionStateForCooking(eventList: PlayerEvent[], currentState: ActionState) {
        // Cooking states. These two states are disambiguations of each-other, as
        //  the game hook will list them both as "Cooking".
        let doAddCookingInProgress = false;

        if (currentState.valueOf() == PlayerEventType.CookingState
        ) {
            doAddCookingInProgress = true;

            // Add the "Cooking state" still, as a catch-all for any
            //  cooking-related states
            eventList.push(new PlayerEvent(PlayerEventType.CookingState));
            this.logToPlugin("Player is currently cooking.");
        }

        if (this.lastPlayerStates.includes(PlayerEventType.CookingState)
        ) {
            this.logToPlugin("Player was cooking last tick.");

            // The inventory doesn't always change when we're cooking,
            //  so see if we're in the process of cooking, or if we've
            //  successfuly cooked something, etc.
            if (this.inventoryManager.EventQueue().length > 0) {
                this.logToPlugin("Inventory changed while cooking.");

                const currentItems = this.inventoryManager.EventQueue()[0].currentItems;
                const previousItems = this.inventoryManager.EventQueue()[0].previousItems;
                
                doAddCookingInProgress = false;

                // Check if we have more burnt food in our inventory now compared to last tick.
                // Sum up the stack count for each burnt food stack for each of the two inventories.
                const burnedFood =
                    currentItems.filter(item => item.id === ItemIds.BurntFood)
                                .reduce((sum, item) => sum + item.amount, 0)
                    > previousItems.filter(item => item.id === ItemIds.BurntFood)
                                .reduce((sum, item) => sum + item.amount, 0);

                // If we have more burnt food, then we failed to cook something.
                // If we don't have more burnt food, then we must have successfully cooked something, right? Hopefully..
                if (burnedFood) {
                    eventList.push(new PlayerEvent(PlayerEventType.CookingFailure));
                }
                else {
                    eventList.push(new PlayerEvent(PlayerEventType.CookingSuccess));
                }
            }
            else {
                this.logToPlugin("Inventory did not change while cooking.");
            }
        }

        if (doAddCookingInProgress) {
            this.logToPlugin("Player is cooking, but not done yet.");            // If we're currently cooking, but not done yet, then add the in-progress state.
            eventList.push(new PlayerEvent(PlayerEventType.CookingInProgress));
        }
    }

    /**
     * Adds any of our custom "ActionState"s (i.e. "PlayerEventType"s) to the event list, if
     *  any event occurred. This is used to extend the built-in ActionState enum with
     *  additional states that are useful for sound effects.
     */
    addExtendedActionStates(eventList: PlayerEvent[], currentState: ActionState) {
        // Add any extended action states here.
        
        // Only log if something interesting happened; otherwise important messages
        //  get lost in the spam.
        if (eventList.length > 1) {
            this.logToPlugin(`\t--> Entering function ${this.addExtendedActionStates.name} with current state: ${PlayerEventType[currentState.valueOf()]}`);
        }

        // Crime Success
        if (this.lastPlayerStates.includes(PlayerEventType.PickpocketingState) &&
            currentState.valueOf() != PlayerEventType.PickpocketingState &&
            currentState.valueOf() != PlayerEventType.StunnedState
        ) {
            // If we're no longer pickpocketing, and we didn't get stunned,
            //  and we were pickpocketing before, then we must have
            //  succeeded at a crime.
            eventList.push(new PlayerEvent(PlayerEventType.CrimeSuccess));
        }

        // Ore Depleted
        if (this.lastPlayerStates.includes(PlayerEventType.MiningState) &&
            currentState.valueOf() != PlayerEventType.MiningState
        ) {
            // If we're no longer mining, but we were mining before,
            //  then we must have finished mining a rock.
            eventList.push(new PlayerEvent(PlayerEventType.OreDepleted));
        }

        // Fishing states. These two states are disambiguations of each-other, as
        //  the game hook will list them both as "Fishing".
        if (currentState.valueOf() == PlayerEventType.FishingState
        ) {
            // The inventory changed, so we probably caught a fish.
            //  TODO: make this check the actual item ID's and itemCount
            //  in the future.
            if (this.inventoryManager.EventQueue().length > 0) {
                eventList.push(new PlayerEvent(PlayerEventType.FishCaught));
            }
            else {
                // We must not have caught anything this tick.
                eventList.push(new PlayerEvent(PlayerEventType.FishingInProgress));
            }
        }

        // Woodcutting states. These two states are disambiguations of each-other, as
        //  the game hook will list them both as "Woodcutting".
        if (currentState.valueOf() == PlayerEventType.WoodcuttingState) {
            if (this.inventoryManager.EventQueue().length > 0) {
                // The inventory changed, so we probably received logs.
                //  Not a foolproof algorithm, I'll have to check the item IDs eventually.
                eventList.push(new PlayerEvent(PlayerEventType.WoodcutLogsReceived));
            }
            else {
                // We must not have received logs this tick, so we are still chopping.
                eventList.push(new PlayerEvent(PlayerEventType.WoodcutInProgress));
            }
        }

        this.addExtendedActionStateForCooking(eventList, currentState);

        // Full Inventory
        if (this.inventoryManager.EventQueue().length > 0) {
            // If the inventory changed, we should check if it was full.
            const currentItems = this.inventoryManager.EventQueue()[0].currentItems;
            const previousItems = this.inventoryManager.EventQueue()[0].previousItems;

            // Check if the inventory was full previously
            const wasInventoryFull = previousItems.filter(item => item.isNull === false).length >= 28;

            // Check if the inventory is full
            const isInventoryFull = currentItems.filter(item => item.isNull === false).length >= 28;

            if (!wasInventoryFull && isInventoryFull) {
                eventList.push(new PlayerEvent(PlayerEventType.FullInventory));
            }
        }

        // Only log if something interesting happened; otherwise important messages
        //  get lost in the spam.
        if (eventList.length > 1) {
            this.logToPlugin(`\t<-- Exiting function ${this.addExtendedActionStates.name}, with eventList: [${eventList.map(e => PlayerEventType[e.eventType]).join(", ")}]`);
        }
    }

    getCurrentPlayerEvents() : PlayerEvent[] {
        const player = this.basePlugin.gameHooks.EntityManager.Instance.MainPlayer;
        if (!player) return [];

        var currentState = player._currentState.getCurrentState();
        var events: PlayerEvent[] = [];

        this.addExtendedActionStates(events, currentState);

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
            // Only check every 1500ms to avoid excessive checks
            return;
        }

        this.lastCheckTimestamp = currentTimestamp;

        // Poll any submodules that need polling. Currently, there's only this one.
        this.inventoryManager.pollForInventoryEvents();

        var currentEvents = this.getCurrentPlayerEvents();

        this.processPlayerEvents(player, currentEvents);
    }

    processPlayerEvents(player, events: PlayerEvent[]) {

        for (let event of events) {
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

            // Ore Depleted
            else if (event.eventType == PlayerEventType.OreDepleted) {
                // The source of the sound effect.
                let sfxSource = new SfxSource({
                    type: SfxSourceType.Player,
                    position: new Vector3d(player.CurrentGamePosition.x, player.CurrentGamePosition.y, player.CurrentGamePosition.z)
                });

                new SoundEffect({
                    type: SfxType.OreDepleted,
                    moduleHandle: this,
                    category: SfxCategory.NonCritical,
                    source: sfxSource
                }).play();
            }

            // Fishing in progress
            else if (event.eventType == PlayerEventType.FishingInProgress) {
                // The source of the sound effect.
                let sfxSource = new SfxSource({
                    type: SfxSourceType.Player,
                    position: new Vector3d(player.CurrentGamePosition.x, player.CurrentGamePosition.y, player.CurrentGamePosition.z)
                });

                new SoundEffect({
                    type: SfxType.FishingInProgress,
                    moduleHandle: this,
                    category: SfxCategory.NonCritical,
                    source: sfxSource
                }).play();
            }

            // Fish caught
            else if (event.eventType == PlayerEventType.FishCaught) {
                // The source of the sound effect.
                let sfxSource = new SfxSource({
                    type: SfxSourceType.Player,
                    position: new Vector3d(player.CurrentGamePosition.x, player.CurrentGamePosition.y, player.CurrentGamePosition.z)
                });

                new SoundEffect({
                    type: SfxType.FishCaught,
                    moduleHandle: this,
                    category: SfxCategory.NonCritical,
                    source: sfxSource
                }).play();
            }

            // Woodcutting in progress
            else if (event.eventType == PlayerEventType.WoodcutInProgress) {
                // The source of the sound effect.
                let sfxSource = new SfxSource({
                    type: SfxSourceType.Player,
                    position: new Vector3d(player.CurrentGamePosition.x, player.CurrentGamePosition.y, player.CurrentGamePosition.z)
                });

                new SoundEffect({
                    type: SfxType.WoodcutInProgress,
                    moduleHandle: this,
                    category: SfxCategory.NonCritical,
                    source: sfxSource
                }).play();
            }

            // Woodcutting logs received
            else if (event.eventType == PlayerEventType.WoodcutLogsReceived) {
                // The source of the sound effect.
                let sfxSource = new SfxSource({
                    type: SfxSourceType.Player,
                    position: new Vector3d(player.CurrentGamePosition.x, player.CurrentGamePosition.y, player.CurrentGamePosition.z)
                });
                
                new SoundEffect({
                    type: SfxType.WoodcutLogsReceived,
                    moduleHandle: this,
                    category: SfxCategory.NonCritical,
                    source: sfxSource
                }).play();
            }

            // Cooking success
            else if (event.eventType == PlayerEventType.CookingSuccess) {
                // The source of the sound effect.
                let sfxSource = new SfxSource({
                    type: SfxSourceType.Player,
                    position: new Vector3d(player.CurrentGamePosition.x, player.CurrentGamePosition.y, player.CurrentGamePosition.z)
                });

                new SoundEffect({
                    type: SfxType.CookingSuccess,
                    moduleHandle: this,
                    category: SfxCategory.NonCritical,
                    source: sfxSource
                }).play();
            }

            // NOT supposed to be attached to the if-elseif chain, we can have a full
            //  inventory and still be doing something else, too
            if (event.eventType == PlayerEventType.FullInventory) {
                // The source of the sound effect.
                let sfxSource = new SfxSource({
                    type: SfxSourceType.UI
                });

                new SoundEffect({
                    type: SfxType.FullInventory,
                    moduleHandle: this,
                    category: SfxCategory.UI,
                    source: sfxSource
                }).play();
            }
        }

        // Update the last known player state to the most recent event's state.
        if (events.length > 0) {
            this.lastPlayerStates = events.map(e => e.eventType);
        } else {
            this.lastPlayerStates = [ PlayerEventType.Any ];
        }
    }
}