import matplotlib.pyplot as plt
import matplotlib.cm as cm

# Data provided as a list of dictionaries
data = [
    {"name": "armur_ai", "x": 58, "y": 11},
    {"name": "aegis", "x": 76, "y": 3},
    {"name": "deepseek_r1", "x": 45, "y": 9},
    {"name": "openai_o3_mini", "x": 41, "y": 9},
    {"name": "savant", "x": 21, "y": 18},
    {"name": "openai_o3_mini_high", "x": 36, "y": 9},
    {"name": "audit_one", "x": 18, "y": 2},
    {"name": "quill_shield", "x": 6, "y": 3},
    {"name": "scau", "x": 33, "y": 0},
    {"name": "code_genie_ai", "x": 15, "y": 7},
    {"name": "yeschat_ai", "x": 42, "y": 9},
    {"name": "grok", "x": 24, "y": 11},
    {"name": "slither", "x": 84, "y": 5}
]

# Create a new figure with a defined size
plt.figure(figsize=(8, 6))

# Generate a colormap with as many distinct colors as there are data points
cmap = cm.get_cmap('tab20', len(data))

# Plot each point individually to assign a unique color and label
for i, point in enumerate(data):
    plt.scatter(point['x'], point['y'], 
                s=200,                # Increase marker size
                color=cmap(i),        # Unique color from the colormap
                label=point['name'])  # Label for the legend

# Set the x and y axis limits to start at 0
plt.xlim(left=0)
plt.ylim(bottom=0)

# Add grid lines for better readability
plt.grid(True)

# Set the title and labels for axes
plt.title('Data Visualization')
plt.xlabel('X-axis')
plt.ylabel('Y-axis')

# Create a legend to map colors to names; adjust marker scale in legend
plt.legend(title='Names', loc='upper right')

# Display the plot
plt.show()
