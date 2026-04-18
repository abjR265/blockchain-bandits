"""Copy-paste this into a Colab cell at the top of every notebook.

Mounts Drive, clones the repo, installs deps. Safe to rerun.
"""

# ruff: noqa

SETUP = r"""
from google.colab import drive
drive.mount('/content/drive')

%cd /content
!rm -rf blockchain-bandits
!git clone https://github.com/<your-org>/blockchain-bandits.git
%cd blockchain-bandits/ml

# Install deps
!pip install -q uv
!uv pip install --system -e .

# Auth: BigQuery + W&B
from google.colab import auth
auth.authenticate_user()

import os, getpass
os.environ['WANDB_API_KEY'] = getpass.getpass('W&B API key: ')

import wandb
wandb.login()
"""

print(SETUP)
